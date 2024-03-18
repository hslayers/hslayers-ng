import {Layer} from 'ol/layer';

import {AccessRightsModel} from '../access-rights.model';
import {BoundingBoxObject} from '../bounding-box-object.type';

export type CompoData = {
  name?: string;
  abstract?: string;
  keywords?: string;
  layers?: Layer[];
  id?: string;
  thumbnail?: any;
  bbox?: BoundingBoxObject;
  access_rights?: AccessRightsModel;
  workspace?: string;
};
