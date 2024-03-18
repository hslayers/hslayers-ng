import {AccessRightsModel} from 'hslayers-ng/types';

export type GetLayersResponse = {
  access_rights: AccessRightsModel;
  bounding_box: number[];
  name: string;
  title: string;
  updated_at: string;
  url: string;
  uuid: string;
  workspace: string;
};
