import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsEndpoint} from 'hslayers-ng/shared/endpoints';
import {HsLaymanLayerDescriptor} from 'hslayers-ng/components/save-map';
import {TRANSLITERATION_MAP} from './transliteration-map';
import {
  getHsLaymanSynchronizing,
  getName,
  getTitle,
} from 'hslayers-ng/common/extensions';

export const PREFER_RESUMABLE_SIZE_LIMIT = 2 * 1024 * 1024; // 2 MB
export const SUPPORTED_SRS_LIST = [
  'EPSG:3857',
  'EPSG:4326',
  'EPSG:5514',
  'EPSG:32633',
  'EPSG:32634',
  'EPSG:3034',
  'EPSG:3035',
  'EPSG:3059',
];

/**
 * Function to transliterate Czech and Slovak characters
 */
function transliterate(text: string) {
  return text
    .split('')
    .map((char) => TRANSLITERATION_MAP[char] || char)
    .join('');
}

/**
 * Get Layman friendly name for layer based on its title by
 * replacing spaces with underscores, converting to lowercase, etc.
 * see https://github.com/jirik/layman/blob/c79edab5d9be51dee0e2bfc5b2f6a380d2657cbd/src/layman/util.py#L30
 * @param title - Title to get Layman-friendly name for
 * @returns New layer name
 */
export function getLaymanFriendlyLayerName(title: string): string {
  title = transliterate(title)
    .toLowerCase()
    .replace(/[^\w\s\-\.]/gm, '') //Remove spaces
    .trim()
    .replace(/[\s\-\._]+/gm, '_') //Remove dashes
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\x7F]/g, ''); //Remove non-ascii letters https://stackoverflow.com/questions/20856197/remove-non-ascii-character-in-string
  return title;
}

/**
 * Get layman friendly name of layer based primary on name
 * and secondary on title attributes.
 *
 * @param layer - Layer to get the name for
 */
export function getLayerName(layer: Layer<Source>): string {
  const layerName = getName(layer) || getTitle(layer);
  if (layerName == undefined) {
    this.$log.warn('Layer title/name not set for', layer);
  }
  return getLaymanFriendlyLayerName(layerName);
}

export function wfsNotAvailable(descr: HsLaymanLayerDescriptor) {
  return descr.wfs?.status == 'NOT_AVAILABLE';
}

export function layerParamPendingOrStarting(
  descr: HsLaymanLayerDescriptor,
  param: string,
) {
  return descr[param]?.status == 'PENDING' || descr[param]?.status == 'STARTED';
}

export function wfsFailed(descr: HsLaymanLayerDescriptor) {
  return descr.wfs?.status == 'FAILURE';
}

export function getSupportedSrsList(ep: HsEndpoint) {
  if (isAtLeastVersions(ep, '1.16.0')) {
    return SUPPORTED_SRS_LIST;
  }
  return SUPPORTED_SRS_LIST.slice(0, 2);
}

/**
 * @param ep - Layman endpoint
 * @param version - Version which the endpoint version will be compared with
 */
export function isAtLeastVersions(ep: HsEndpoint, version: string) {
  let epVer = ep.version.split('.').map((part) => parseInt(part));
  const compareVer = version.split('.').map((part) => parseInt(part));
  if (epVer.length != compareVer.length) {
    epVer = epVer.slice(0, (epVer.length - compareVer.length) * -1);
  }

  for (let i = 0; i < epVer.length; i++) {
    if (epVer[i] < compareVer[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Wait until layer synchronization is complete
 * @param layer - OL Layer
 */
export async function awaitLayerSync(layer: Layer): Promise<boolean> {
  while (getHsLaymanSynchronizing(layer)) {
    await new Promise((r) => setTimeout(r, 200));
  }
  return true;
}

/**
 * Check wether provided url belongs to Layman endpoint
 * @param url - URL to be checked
 * @param layman - Layman endpoint
 */
export function isLaymanUrl(url: string, layman: HsEndpoint): boolean {
  if (!layman) {
    return false;
  }

  /**
   *If url includes layman-proxy its for sure from layman
   *additionaly it allows loading of vector layers saved on production
   *using layman-proxy in dev env
   */
  if (url.includes('layman-proxy')) {
    return true;
  }
  const laymanUrl = layman.type.includes('wagtail')
    ? layman.url.split('layman-proxy')[0]
    : layman.url;
  return url.includes(laymanUrl);
}
