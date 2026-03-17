import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

/**
 * Object describing endpoint, layer and arrays
 * for each of the methods: update, del, insert containing the features to be processed
 */

export type WfsSyncParams = {
  /** Array of features to add */
  add: Feature<Geometry>[];
  /** Array of features to update */
  upd: Feature<Geometry>[];
  /** Array of features to delete */
  del: Feature<Geometry>[];
  /** OpenLayers layer which has to have a title attribute */
  layer: VectorLayer<VectorSource<Feature>>;
};
