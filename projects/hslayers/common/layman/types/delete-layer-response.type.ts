export type DeleteAllLayersResponse = {
  access_rights?: {
    read?: string[];
    write?: string[];
  };
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
