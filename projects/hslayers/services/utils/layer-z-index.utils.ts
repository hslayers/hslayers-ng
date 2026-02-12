import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

/**
 * Shared z-index helpers for layer ordering.
 */

export function getLayerZIndex(layer: Layer<Source>): number {
  return layer.getZIndex() ?? 0;
}

export function getMaxLayerZIndex(
  layers: Layer<Source>[],
  fallback = -1,
): number {
  if (layers.length === 0) {
    return fallback;
  }
  return Math.max(...layers.map(getLayerZIndex));
}

export function getMinLayerZIndex(layers: Layer<Source>[]): number | undefined {
  if (layers.length === 0) {
    return undefined;
  }
  return Math.min(...layers.map(getLayerZIndex));
}

/**
 * Add delta to z-index of each layer (e.g. to make room for a new layer below).
 */
export function shiftLayersZIndex(
  layers: Layer<Source>[],
  delta: number,
): void {
  if (delta === 0) {
    return;
  }
  for (const layer of layers) {
    layer.setZIndex(getLayerZIndex(layer) + delta);
  }
}
