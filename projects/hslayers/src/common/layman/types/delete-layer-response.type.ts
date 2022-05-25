import {accessRightsModel} from './../../../components/add-data/common/access-rights.model';

export type DeleteAllLayersResponse = {
  access_rights?: accessRightsModel;
  name?: string;
  title?: string;
  uuid?: string;
  url?: string;
  code?: number;
  detail?: any;
  error?: {
    message: string;
  };
  message?: string;
};

export type DeleteSingleLayerResponse = {
  name?: string;
  uuid?: string;
  url?: string;
  code?: number;
  detail?: any;
  error?: {
    message: string;
  };
  message?: string;
};
