import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsEndpoint} from '../endpoints/endpoint.interface';
import {HsLaymanLayerDescriptor} from '../../components/save-map/interfaces/layman-layer-descriptor.interface';
import {getHsLaymanSynchronizing, getName, getTitle} from '../layer-extensions';

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
 * ASCII transliterations for a wide range of European characters
 * commonly used in various languages.
 */
const TRANSLITERATION_MAP = {
  // Latin-1 Supplement
  'À': 'A',
  'Á': 'A',
  'Â': 'A',
  'Ã': 'A',
  'Ä': 'A',
  'Å': 'A',
  'Æ': 'AE',
  'Ç': 'C',
  'È': 'E',
  'É': 'E',
  'Ê': 'E',
  'Ë': 'E',
  'Ì': 'I',
  'Í': 'I',
  'Î': 'I',
  'Ï': 'I',
  'Ð': 'D',
  'Ñ': 'N',
  'Ò': 'O',
  'Ó': 'O',
  'Ô': 'O',
  'Õ': 'O',
  'Ö': 'O',
  '×': 'x',
  'Ø': 'O',
  'Ù': 'U',
  'Ú': 'U',
  'Û': 'U',
  'Ü': 'U',
  'Ý': 'Y',
  'Þ': 'Th',
  'ß': 'ss',
  'à': 'a',
  'á': 'a',
  'â': 'a',
  'ã': 'a',
  'ä': 'a',
  'å': 'a',
  'æ': 'ae',
  'ç': 'c',
  'è': 'e',
  'é': 'e',
  'ê': 'e',
  'ë': 'e',
  'ì': 'i',
  'í': 'i',
  'î': 'i',
  'ï': 'i',
  'ð': 'd',
  'ñ': 'n',
  'ò': 'o',
  'ó': 'o',
  'ô': 'o',
  'õ': 'o',
  'ö': 'o',
  '÷': 'x',
  'ø': 'o',
  'ù': 'u',
  'ú': 'u',
  'û': 'u',
  'ü': 'u',
  'ý': 'y',
  'þ': 'th',
  'ÿ': 'y',

  // Latin Extended-A
  'Ā': 'A',
  'ā': 'a',
  'Ă': 'A',
  'ă': 'a',
  'Ą': 'A',
  'ą': 'a',
  'Ć': 'C',
  'ć': 'c',
  'Ĉ': 'C',
  'ĉ': 'c',
  'Ċ': 'C',
  'ċ': 'c',
  'Č': 'C',
  'č': 'c',
  'Ď': 'D',
  'ď': 'd',
  'Đ': 'D',
  'đ': 'd',
  'Ē': 'E',
  'ē': 'e',
  'Ĕ': 'E',
  'ĕ': 'e',
  'Ė': 'E',
  'ė': 'e',
  'Ę': 'E',
  'ę': 'e',
  'Ě': 'E',
  'ě': 'e',
  'Ĝ': 'G',
  'ĝ': 'g',
  'Ğ': 'G',
  'ğ': 'g',
  'Ġ': 'G',
  'ġ': 'g',
  'Ģ': 'G',
  'ģ': 'g',
  'Ĥ': 'H',
  'ĥ': 'h',
  'Ħ': 'H',
  'ħ': 'h',
  'Ĩ': 'I',
  'ĩ': 'i',
  'Ī': 'I',
  'ī': 'i',
  'Ĭ': 'I',
  'ĭ': 'i',
  'Į': 'I',
  'į': 'i',
  'İ': 'I',
  'ı': 'i',
  'Ĳ': 'IJ',
  'ĳ': 'ij',
  'Ĵ': 'J',
  'ĵ': 'j',
  'Ķ': 'K',
  'ķ': 'k',
  'ĸ': 'k',
  'Ĺ': 'L',
  'ĺ': 'l',
  'Ļ': 'L',
  'ļ': 'l',
  'Ľ': 'L',
  'ľ': 'l',
  'Ŀ': 'L',
  'ŀ': 'l',
  'Ł': 'L',
  'ł': 'l',

  // Latin Extended-B
  'Ń': 'N',
  'ń': 'n',
  'Ņ': 'N',
  'ņ': 'n',
  'Ň': 'N',
  'ň': 'n',
  'ŉ': 'n',
  'Ŋ': 'N',
  'ŋ': 'n',
  'Ō': 'O',
  'ō': 'o',
  'Ŏ': 'O',
  'ŏ': 'o',
  'Ő': 'O',
  'ő': 'o',
  'Œ': 'OE',
  'œ': 'oe',
  'Ŕ': 'R',
  'ŕ': 'r',
  'Ŗ': 'R',
  'ŗ': 'r',
  'Ř': 'R',
  'ř': 'r',
  'Ś': 'S',
  'ś': 's',
  'Ŝ': 'S',
  'ŝ': 's',
  'Ş': 'S',
  'ş': 's',
  'Š': 'S',
  'š': 's',
  'Ţ': 'T',
  'ţ': 't',
  'Ť': 'T',
  'ť': 't',
  'Ŧ': 'T',
  'ŧ': 't',
  'Ũ': 'U',
  'ũ': 'u',
  'Ū': 'U',
  'ū': 'u',
  'Ŭ': 'U',
  'ŭ': 'u',
  'Ů': 'U',
  'ů': 'u',
  'Ű': 'U',
  'ű': 'u',
  'Ų': 'U',
  'ų': 'u',
  'Ŵ': 'W',
  'ŵ': 'w',
  'Ŷ': 'Y',
  'ŷ': 'y',
  'Ÿ': 'Y',
  'Ź': 'Z',
  'ź': 'z',
  'Ż': 'Z',
  'ż': 'z',
  'Ž': 'Z',
  'ž': 'z',
} as const;

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
  const laymanUrl = layman.type.includes('wagtail')
    ? layman.url.split('layman-proxy')[0]
    : layman.url;
  return url.includes(laymanUrl);
}
