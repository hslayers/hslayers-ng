import dns from 'node:dns';
import net from 'node:net';

const DEFAULT_ALLOWED_PORTS = new Set([80, 443, 8080, 8443]);

/**
 * @returns {Set<number>} Set of allowed upstream ports (from PROXY_ALLOWED_PORTS env or defaults).
 */
export function getAllowedPorts() {
  const env = process.env.PROXY_ALLOWED_PORTS;
  if (!env) return DEFAULT_ALLOWED_PORTS;
  const parsed = env
    .split(',')
    .map((p) => Number.parseInt(p.trim(), 10))
    .filter((p) => Number.isInteger(p) && p > 0 && p < 65536);
  return parsed.length ? new Set(parsed) : DEFAULT_ALLOWED_PORTS;
}

/**
 * Validate the shape of the upstream URL before any network activity.
 *
 * @param {URL} url - Parsed upstream URL.
 * @throws {SsrfError} when the URL is unsafe.
 */
export function validateUpstreamUrl(url) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new SsrfError(`Disallowed scheme: ${url.protocol}`);
  }
  if (url.username || url.password) {
    throw new SsrfError('URL with embedded credentials is not allowed');
  }
  if (!url.hostname) {
    throw new SsrfError('Missing hostname');
  }
  const port = url.port
    ? Number.parseInt(url.port, 10)
    : url.protocol === 'https:'
      ? 443
      : 80;
  const allowed = getAllowedPorts();
  if (!allowed.has(port)) {
    throw new SsrfError(`Disallowed port: ${port}`);
  }
  if (isIpLiteral(url.hostname)) {
    const normalized = normalizeIp(url.hostname);
    if (isBlockedAddress(normalized)) {
      throw new SsrfError(`Disallowed IP literal: ${url.hostname}`);
    }
  }
}

/**
 * Resolve the hostname and ensure all returned addresses are publicly routable.
 * Returns the first address to pin against DNS rebinding during dispatch.
 *
 * @param {string} hostname - DNS name or IP literal.
 * @returns {Promise<{address: string, family: 4 | 6}>}
 * @throws {SsrfError}
 */
export async function resolveAndScreen(hostname) {
  if (isIpLiteral(hostname)) {
    const normalized = normalizeIp(hostname);
    if (isBlockedAddress(normalized)) {
      throw new SsrfError(`Disallowed IP: ${hostname}`);
    }
    return { address: normalized, family: net.isIPv6(normalized) ? 6 : 4 };
  }
  let addresses;
  try {
    addresses = await dns.promises.lookup(hostname, {
      all: true,
      verbatim: true,
    });
  } catch (err) {
    throw new SsrfError(`DNS lookup failed for ${hostname}: ${err.message}`);
  }
  if (!addresses.length) {
    throw new SsrfError(`No DNS records for ${hostname}`);
  }
  for (const { address } of addresses) {
    if (isBlockedAddress(address)) {
      throw new SsrfError(
        `Hostname ${hostname} resolves to disallowed address ${address}`,
      );
    }
  }
  const first = addresses[0];
  return {
    address: first.address,
    family: /** @type {4 | 6} */ (first.family),
  };
}

export class SsrfError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SsrfError';
  }
}

function isIpLiteral(host) {
  const bare = host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;
  return net.isIP(bare) !== 0;
}

function normalizeIp(host) {
  const bare = host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;
  return bare;
}

/**
 * Block private, reserved, loopback, link-local, multicast, and cloud-metadata
 * addresses. Intentionally conservative: anything that is not clearly on the
 * public Internet is rejected.
 *
 * @param {string} address
 * @returns {boolean}
 */
export function isBlockedAddress(address) {
  if (net.isIPv4(address)) {
    return isBlockedIpv4(address);
  }
  if (net.isIPv6(address)) {
    return isBlockedIpv6(address);
  }
  return true;
}

function isBlockedIpv4(ip) {
  const parts = ip.split('.').map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12
  if (a === 192 && b === 168) return true; // 192.168/16
  if (a === 192 && b === 0 && parts[2] === 0) return true; // 192.0.0/24
  if (a === 192 && b === 0 && parts[2] === 2) return true; // TEST-NET-1
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a === 198 && b === 51 && parts[2] === 100) return true; // TEST-NET-2
  if (a === 203 && b === 0 && parts[2] === 113) return true; // TEST-NET-3
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64/10
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function isBlockedIpv6(ip) {
  const lowered = ip.toLowerCase();
  if (lowered === '::' || lowered === '::1') return true;
  if (lowered.startsWith('fe80:') || lowered.startsWith('fe80::')) return true;
  if (lowered.startsWith('fc') || lowered.startsWith('fd')) return true; // ULA fc00::/7
  if (lowered.startsWith('ff')) return true; // multicast
  const v4Mapped = lowered.match(/^::ffff:([\d.]+)$/);
  if (v4Mapped) {
    return isBlockedIpv4(v4Mapped[1]);
  }
  const v4Compat = lowered.match(/^::([\d.]+)$/);
  if (v4Compat) {
    return isBlockedIpv4(v4Compat[1]);
  }
  if (lowered.startsWith('2001:db8:')) return true; // documentation
  return false;
}
