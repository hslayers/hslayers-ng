/**
 * Classify an upstream URL as a known GIS map service request or named
 * integration. Anything that does not match is rejected, which is the
 * primary authorization boundary of the gateway (second line of defense
 * after SSRF checks).
 *
 * @param {URL} url - Parsed upstream URL (scheme already verified to be http/https).
 * @returns {{kind: string} | {kind: 'reject', reason: string}}
 */
export function classifyGisRequest(url) {
  const host = url.hostname.toLowerCase();
  const pathname = url.pathname;
  const params = url.searchParams;

  const namedHost = matchNamedIntegration(host, pathname);
  if (namedHost) {
    return { kind: namedHost };
  }

  const ogc = matchOgcService(params);
  if (ogc) {
    return { kind: ogc };
  }

  if (ARCGIS_PATH_REGEX.test(pathname)) {
    return { kind: 'arcgis' };
  }

  if (isOgcApiPath(pathname)) {
    return { kind: 'ogcapi' };
  }

  if (isCesium3dTilesPath(pathname)) {
    return { kind: 'cesium' };
  }

  if (XYZ_TILE_REGEX.test(pathname)) {
    return { kind: 'xyz' };
  }

  return {
    kind: 'reject',
    reason:
      'URL does not match any supported GIS service (WMS, WMTS, WFS, WCS, CSW, ArcGIS REST, OGC API, XYZ/TMS, 3D Tiles) or named integration.',
  };
}

const NAMED_INTEGRATION_HOSTS = new Map([
  ['api.geonames.org', 'geonames'],
  ['api.openrouteservice.org', 'ors'],
  ['tinyurl.com', 'tinyurl'],
]);

function matchNamedIntegration(host, pathname) {
  const named = NAMED_INTEGRATION_HOSTS.get(host);
  if (!named) {
    return null;
  }
  if (named === 'geonames' && !pathname.startsWith('/searchJSON')) {
    return null;
  }
  if (named === 'tinyurl' && pathname !== '/api-create.php') {
    return null;
  }
  return named;
}

const OGC_SERVICES = new Set(['WMS', 'WMTS', 'WFS', 'WCS', 'CSW']);

const OGC_ALLOWED_REQUESTS = new Set([
  'GETCAPABILITIES',
  'GETMAP',
  'GETFEATUREINFO',
  'GETLEGENDGRAPHIC',
  'GETTILE',
  'GETFEATURE',
  'DESCRIBEFEATURETYPE',
  'GETPROPERTYVALUE',
  'LISTSTOREDQUERIES',
  'DESCRIBESTOREDQUERIES',
  'GETCOVERAGE',
  'DESCRIBECOVERAGE',
  'GETRECORDS',
  'GETRECORDBYID',
  'GETDOMAIN',
]);

function matchOgcService(params) {
  const service = getParamCaseInsensitive(params, 'SERVICE');
  const request = getParamCaseInsensitive(params, 'REQUEST');
  if (!service) {
    return null;
  }
  const svc = service.toUpperCase();
  if (!OGC_SERVICES.has(svc)) {
    return null;
  }
  if (request && !OGC_ALLOWED_REQUESTS.has(request.toUpperCase())) {
    return null;
  }
  return svc.toLowerCase();
}

function getParamCaseInsensitive(params, key) {
  const target = key.toLowerCase();
  for (const [k, v] of params.entries()) {
    if (k.toLowerCase() === target) {
      return v;
    }
  }
  return null;
}

const ARCGIS_PATH_REGEX =
  /\/(rest|services)\/.*\/(MapServer|FeatureServer|ImageServer|GPServer|GeometryServer|VectorTileServer|WMSServer|WFSServer|WMTSServer|SceneServer)(\/|$)/i;

const OGC_API_SEGMENTS = new Set([
  'collections',
  'conformance',
  'api',
  'tiles',
  'styles',
  'processes',
  'jobs',
  'queryables',
  'items',
]);

function isOgcApiPath(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return false;
  return segments.some((seg) => OGC_API_SEGMENTS.has(seg.toLowerCase()));
}

const CESIUM_TILE_EXTENSIONS = /\.(terrain|b3dm|i3dm|pnts|cmpt|glb|gltf)$/i;
const CESIUM_TILE_MANIFESTS = /\/(tileset\.json|layer\.json)$/i;

function isCesium3dTilesPath(pathname) {
  return (
    CESIUM_TILE_MANIFESTS.test(pathname) ||
    CESIUM_TILE_EXTENSIONS.test(pathname)
  );
}

const XYZ_TILE_REGEX = /\/-?\d{1,3}\/-?\d+\/-?\d+(?:@\dx)?\.(?:png|jpg|jpeg|webp|gif|pbf|mvt|json)$/i;
