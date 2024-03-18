import {AccessRightsModel} from '../access-rights.model';

export type UpsertLayerObject = {
  title?: string;
  name?: string;
  crs?: string;
  workspace?: string;
  access_rights?: AccessRightsModel;
  style?: string; //sld param is deprecated in Layman. Use style instead
};
