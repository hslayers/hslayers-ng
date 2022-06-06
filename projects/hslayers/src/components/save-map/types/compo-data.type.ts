import {Layer} from 'ol/layer';

import {BoundingBoxObject} from './bounding-box-object.type';
import {accessRightsModel} from '../../add-data/common/access-rights.model';

export type CompoData = {
  name?: string;
  abstract?: string;
  keywords?: string;
  layers?: {title?: string; checked?: boolean; layer?: Layer}[];
  id?: string;
  thumbnail?: any;
  bbox?: BoundingBoxObject;
  currentCompositionTitle?: string;
  currentComposition?: string;
  access_rights?: accessRightsModel;
  workspace?: string;
};
