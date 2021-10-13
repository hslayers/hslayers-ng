import Feature from 'ol/Feature';
import {Geometry} from 'ol/geom';

import {accessRightsModel} from '../common/access-rights.model';

export type HsVectorLayerOptions = {
  opacity?: number;
  visible?: boolean;
  path?: string;
  fromComposition?: boolean;
  style?: any;
  extractStyles?: boolean;
  features?: Feature<Geometry>[];
  workspace?: string;
  access_rights?: accessRightsModel;
  queryCapabilities?: boolean;
  sld?: string;
};
