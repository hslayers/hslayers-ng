import Feature from 'ol/Feature';
import {accessRightsInterface} from '../common/access-rights.interface';

export type HsVectorLayerOptions = {
  opacity?: number;
  visible?: boolean;
  path?: string;
  fromComposition?: boolean;
  style?: any;
  extractStyles?: boolean;
  features?: Feature[];
  workspace?: string;
  access_rights?: accessRightsInterface;
  queryCapabilities?: boolean;
  sld?: string;
};
