import {Layer} from 'ol/layer';

import {BoundingBoxObject} from '../bounding-box-object.type';
import {accessRightsModel} from '../access-rights.model';

export type CompoData = {
  name?: string;
  abstract?: string;
  keywords?: string;
  layers?: Layer[];
  id?: string;
  thumbnail?: any;
  bbox?: BoundingBoxObject;
  access_rights?: accessRightsModel;
  workspace?: string;
};
