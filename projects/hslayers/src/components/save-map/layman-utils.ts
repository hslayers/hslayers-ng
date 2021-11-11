import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsLaymanLayerDescriptor} from './layman-layer-descriptor.interface';
import {getName, getTitle} from '../../common/layer-extensions';

export const PREFER_RESUMABLE_SIZE_LIMIT = 2 * 1024 * 1024; // 2 MB
/**
 * Get Layman friendly name for layer based on its title by
 * replacing spaces with underscores, converting to lowercase, etc.
 * see https://github.com/jirik/layman/blob/c79edab5d9be51dee0e2bfc5b2f6a380d2657cbd/src/layman/util.py#L30
 * @param title - Title to get Layman-friendly name for
 * @returns New layer name
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

export function wfsPendingOrStarting(descr: HsLaymanLayerDescriptor) {
  return descr.wfs?.status == 'PENDING' || descr.wfs?.status == 'STARTED';
}

export function wfsFailed(descr: HsLaymanLayerDescriptor) {
  return descr.wfs?.status == 'FAILURE';
}
