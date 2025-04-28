import {HsEndpoint} from '../endpoint.interface';

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
  date?: string;
  dateStamp?: string;
}

export interface HsGetMapsComposition {
  access_rights: {
    read: string[];
    write: string[];
  };
  bounding_box: number[];
  name: string;
  native_bounding_box: number[];
  native_crs: string;
  publication_type: string;
  title: string;
  updated_at: string;
  url: string;
  uuid: string;
  workspace: string;
}

export interface LaymanCompositionDescriptor extends HsGetMapsComposition {
  description: string;
  layman_metadata: {
    publication_status: 'COMPLETE' | 'INCOMPLETE' | 'UPDATING';
  };
  metadata: {
    identifier: string;
    record_url: string;
    csw_url: string;
    comparison_url: string;
    status?: any;
    error?: any;
  };
  thumbnail: {
    path: string;
    url: string;
    error?: any;
  };
  file: any;
}
