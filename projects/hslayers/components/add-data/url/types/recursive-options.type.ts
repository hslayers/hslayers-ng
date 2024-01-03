import {LayerOptions} from 'hslayers-ng/components/compositions';

/**
 * @param shallow - Whether to go through full depth of layer tree or to stop on first queryable
 * For now utilized for WMS only.
 */
export type AddLayersRecursivelyOptions = {
  checkedOnly?: boolean;
  shallow?: boolean;
  layerOptions?: LayerOptions;
};
