import {accessRightsModel} from 'hslayers-ng/common/types';

export type UpsertLayerObject = {
  title?: string;
  name?: string;
  crs?: string;
  workspace?: string;
  access_rights?: accessRightsModel;
  style?: string; //sld param is deprecated in Layman. Use style instead
};
