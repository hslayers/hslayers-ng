import {layerOptions} from '../../../compositions/layer-parser/composition-layer-options.type';

/**
 * @param shallow - Wether to go through full depth of layer tree or to stop on first queryable
 * For now utilized for WMS only.
 */
export type addLayersRecursivelyOptions = {
  checkedOnly?: boolean;
  shallow?: boolean;
  layerOptions?: layerOptions;
};
