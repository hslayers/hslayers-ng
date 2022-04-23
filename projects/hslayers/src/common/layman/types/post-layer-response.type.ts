export type PostLayerResponse = {
  name?: string;
  uuid?: string;
  url?: string;
  files_to_upload?: {
    file?: string;
    layman_original_parameter?: string;
  }[];
};
