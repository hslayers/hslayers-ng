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
