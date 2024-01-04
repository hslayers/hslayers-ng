import {Layer} from 'ol/layer';

import {BoundingBoxObject} from 'hslayers-ng/common/types';
import {accessRightsModel} from 'hslayers-ng/common/types';

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
