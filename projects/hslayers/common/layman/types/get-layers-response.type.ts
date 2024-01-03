import {accessRightsModel} from 'hslayers-ng/components/add-data';

export type GetLayersResponse = {
  access_rights: accessRightsModel;
  bounding_box: number[];
  name: string;
  title: string;
  updated_at: string;
  url: string;
  uuid: string;
  workspace: string;
};
