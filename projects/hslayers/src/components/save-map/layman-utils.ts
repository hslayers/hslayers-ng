/**
 * Fix wrong wfs endpoint url if it doesnt run through layman client.
 * It might be due to misconfiguration in layman .env i.e. missing LAYMAN_GS_PROXY_BASE_URL which should be
 * https://<host>/layman/client/geoserver/ or https://<host>/client/geoserver/
 * @param url
 *
 */
export function tweakGeoserverUrl(url: string): string {
  return url.includes('client')
    ? url
    : url.replace('/geoserver', '/client/geoserver');
}
