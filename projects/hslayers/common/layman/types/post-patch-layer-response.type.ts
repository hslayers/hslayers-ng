export type PostPatchLayerResponse = {
  name?: string;
  uuid?: string;
  url?: string;
  files_to_upload?: {
    file?: string;
    layman_original_parameter?: string;
  }[];
  code?: number;
  detail?: any;
  error?: {
    message: string;
  };
  message?: string;
};
