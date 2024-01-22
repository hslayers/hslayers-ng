import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';

/**
 * Object describing endpoint, layer and arrays
 * for each of the methods: update, del, insert containing the features to be processed
 */
export type WfsSyncParams = {
  /** Endpoint description */
  ep: HsEndpoint;
  /** Array of features to add */
  add: Feature<Geometry>[];
  /** Array of features to update */
  upd: Feature<Geometry>[];
  /** Array of features to delete */
  del: Feature<Geometry>[];
  /** OpenLayers layer which has to have a title attribute */
  layer: VectorLayer<VectorSource>;
};
