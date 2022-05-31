import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Geometry} from 'ol/geom';

import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';

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
  layer: VectorLayer<VectorSource<Geometry>>;
};
