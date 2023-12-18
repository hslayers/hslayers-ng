import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';

export interface HsAddDataLayerDescriptor {
  abstract?: string;
  bbox;
  bounding_box?;
  metadata;
  formats?;
  name?: string;
  serviceType?;
  thumbnail?;
  title?: string;
  trida?;
  type: string[];
  availableTypes: string[];
  file?: {
    path?: string;
    file_type?: string;
  };
  links?;
  wms?: {
    url?: string;
  };
  wfs?: {
    url?: string;
  };
  endpoint?: HsEndpoint;
  id?: string;
  workspace?: string;
  editable?: boolean;
  style?: {
    url?: string;
    type?: string;
  };
  featureId?: string;
  highlighted?: boolean;
  toRemove?: boolean;
  access_rights?: {
    read: string[];
    write: string[];
  };
  wfsWmsStatus?: 'AVAILABLE' | 'PREPARING' | 'NOT_AVAILABLE';
  useTiles: boolean;
}
