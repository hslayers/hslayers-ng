import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';

export interface HsMapCompositionDescriptor {
  abstract?: string;
  name?: string;
  title?: string;
  endpoint?: HsEndpoint;
  id?: string;
  uuid?: string;
  serviceType?: string;
  thumbnail?;
  workspace?: string;
  editable?: boolean;
  link?: string;
  links?: {
    url: string;
  }[];
  url?: string;
  featureId?: string;
  highlighted?: boolean;
  access_rights?: {
    read: string[];
    write: string[];
  };
}

export interface LaymanCompositionDescriptor {
  access_rights: {read: string[]; write: string[]};
  bounding_box: number[];
  name: string;
  native_bounding_box: number[];
  native_crs: string;
  publication_type: 'map';
  title: string;
  updated_at: string;
  url: string;
  uuid: string;
  workspace: string;
  file: any;
}
