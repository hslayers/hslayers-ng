import {accessRightsModel} from './../../components/add-data/common/access-rights.model';

export type DeleteAllLayersResponse = {
  access_rights?: accessRightsModel;
  name?: string;
  title?: string;
  uuid?: string;
  url?: string;
};

export type DeleteSingleLayerResponse = {
  name?: string;
  uuid?: string;
  url?: string;
};
