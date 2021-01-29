import {HsLaymanLayerDescriptor} from './layman-layer-descriptor.interface';
import {Layer} from 'ol/layer';
import {getName, getTitle} from '../../common/layer-extensions';

/**
 * Fix wrong wfs endpoint url if it doesnt run through layman client.
 * It might be due to misconfiguration in layman .env i.e. missing LAYMAN_GS_PROXY_BASE_URL which should be
 * https://<host>/layman/client/geoserver/ or https://<host>/client/geoserver/
 * @param url
 *
 */
export function tweakGeoserverUrl(url: string): string {
  return url.includes('client') ||
    !url.includes(window.location.host + '/geoserver')
    ? url
    : url.replace('/geoserver', '/client/geoserver');
}

/**
 * @description Get Layman friendly name for layer based on its title by
 * replacing spaces with underscores, converting to lowercase, etc.
 * see https://github.com/jirik/layman/blob/c79edab5d9be51dee0e2bfc5b2f6a380d2657cbd/src/layman/util.py#L30
 * @function getLaymanFriendlyLayerName
 * @param {string} title Title to get Layman-friendly name for
 * @returns {string} New layer name
 */
export function getLaymanFriendlyLayerName(title: string): string {
  //TODO: Unidecode on server side or just drop the unsupported letters.
  title = title
    .toLowerCase()
    .replace(/[^\w\s\-\.]/gm, '') //Remove spaces
    .trim()
    .replace(/[\s\-\._]+/gm, '_') //Remove dashes
    .replace(/[^\x00-\x7F]/g, ''); //Remove non-ascii letters https://stackoverflow.com/questions/20856197/remove-non-ascii-character-in-string
  return title;
}

/**
 * Get layman friendly name of layer based primary on name
 * and secondary on title attributes.
 *
 * @param layer Layr to get the name for
 */
export function getLayerName(layer: Layer): string {
  const layerName = getName(layer) || getTitle(layer);
  if (layerName == undefined) {
    this.$log.warn('Layer title/name not set for', layer);
  }
  return getLaymanFriendlyLayerName(layerName);
}

export function wfsNotAvailable(descr: HsLaymanLayerDescriptor) {
  return descr.wfs.status == 'NOT_AVAILABLE';
}
