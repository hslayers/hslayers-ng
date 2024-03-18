import {LayerOptions} from '../compositions/composition-layer-options.type';

export type AddLayersRecursivelyOptions = {
  checkedOnly?: boolean;
  /**
   * Whether to go through full depth of layer tree or to stop on first queryable.
   * For now utilized for WMS only.
   */
  shallow?: boolean;
  layerOptions?: LayerOptions;
};
