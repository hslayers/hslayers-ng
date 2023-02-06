import {StatusStateType} from '../types/status-state.type';

export interface HsLaymanLayerDescriptor {
  uuid?: string;
  name?: any;
  title?: string;
  description?: string;
  updated_at?: string;
  wms?: {
    url?: string;
    status?: StatusStateType;
    error?: any;
  };
  wfs?: {
    url?: string;
    status?: StatusStateType;
    error?: any;
  };
  file?: {
    path?: string;
    file_type?: string;
    status?: StatusStateType;
    error?: {
      code?: number;
      message?: string;
    };
  };
  //Only for vector layers
  db_table?: {
    name?: string;
    status?: StatusStateType;
    error?: any;
  };
  style?: {
    url?: string;
    type?: string;
    name?: string;
    status?: StatusStateType;
    error?: any;
  };
  //Deprecated, yet is still there
  sld?: {
    url?: string;
    name?: string;
    status?: StatusStateType;
    error?: any;
  };
  metadata?: {
    identifier?: string;
    record_url?: string;
    csw_url?: string;
    comparison_url?: string;
    status?: StatusStateType;
    error?: any;
  };
  access_rights?: {
    read: string[];
    write: string[];
  };
  bounding_box?: number[];
  native_crs?: any;
  native_bounding_box?: number[];
  url?: string;
  thumbnail?: {
    url?: string;
    status?: StatusStateType;
    error?: any;
  };
  exists?: boolean;
  layman_metadata?: {
    publication_status: 'COMPLETE' | 'INCOMPLETE' | 'UPDATING';
  };
  /**
   * Only when error
   */
  message?: string;
  /**
   * Only when error
   */
  detail?: string;
  /**
   * Only when error
   */
  code?: number;
  /**
   * Only when error
   */
  sub_code?: number;
  //Not part of origial response. Added by describeLayer
  workspace?: string;
}
