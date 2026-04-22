/**
 * Per-integration URL/headers rewrites for non-standard (non-OGC) endpoints
 * that the gateway still speaks: GeoNames (geocoding), OpenRouteService
 * (routing) and TinyURL (link shortener used for map share).
 *
 * Secrets live only on the server: the client never sees the API keys.
 */

/**
 * @param {string} kind - One of 'geonames' | 'ors' | 'tinyurl' | any GIS kind.
 * @param {URL} url - Parsed upstream URL (mutated in place when needed).
 * @param {Headers} headers - Outgoing request headers (mutated in place).
 */
export function applyIntegration(kind, url, headers) {
  switch (kind) {
    case 'geonames':
      rewriteGeonames(url);
      break;
    case 'ors':
      injectOrsAuth(headers);
      break;
    default:
      break;
  }
}

function rewriteGeonames(url) {
  const apiKey = process.env.HS_GEONAMES_API_KEY || 'hslayersng';
  const providerParam = getParamCaseInsensitive(url, 'provider');
  if (providerParam && providerParam.toLowerCase() !== 'geonames') {
    return;
  }
  const name = getParamCaseInsensitive(url, 'name_startsWith');
  const next = new URLSearchParams();
  if (name) {
    next.set('name_startsWith', name);
  }
  next.set('username', apiKey);
  url.search = '?' + next.toString();
  url.pathname = '/searchJSON';
}

function injectOrsAuth(headers) {
  const key = process.env.OPENROUTESERVICE_API_KEY;
  if (key) {
    headers.set('authorization', key);
  }
}

function getParamCaseInsensitive(url, key) {
  const target = key.toLowerCase();
  for (const [k, v] of url.searchParams.entries()) {
    if (k.toLowerCase() === target) {
      return v;
    }
  }
  return null;
}
