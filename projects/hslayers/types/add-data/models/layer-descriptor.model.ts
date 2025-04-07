import {HsLaymanLayerDescriptor} from '../../layman/layman-layer-descriptor.interface';
import {HsEndpoint} from '../../endpoint.interface';
import {
  HsLaymanGetLayer,
  HsLaymanGetLayerWfsWmsStatus,
} from '../../layman/get-layers.interface';

export interface HsAddLayerDescriptorCommon {
  highlighted?: boolean;
  toRemove?: boolean;
  editable?: boolean;
  endpoint?: HsEndpoint;
  availableTypes?: string[];
  bbox?: number[];
  wfsWmsStatus?: HsLaymanGetLayerWfsWmsStatus;
  featureId?: string;
  id?: string;
  type?: string[];
}

/**
 * HSLayers Add Data layer descriptor
 * Consists of uninon of various stages of Layman layer desriptions
 * - when loaded into add-data catalogue list
 */
export type HsAddDataHsLaymanLayerDescriptor = HsLaymanLayerDescriptor &
  HsLaymanGetLayer &
  HsAddLayerDescriptorCommon;

export interface HsAddDataMickaLayerDescriptor
  extends HsAddLayerDescriptorCommon {
  title: string;
  name: string;
  abstract: string;
  links: any; //TODO: property types - string[];
  imgURL: string;
  contacts: any[];
  keywords: string[];
  trida: string;
  serviceType: string;
  formats: string[];
  thumbnail: string;
  mayedit: string;
  public: string;
  scales: string[];
}

export type HsAddDataLayerDescriptor =
  | HsAddDataHsLaymanLayerDescriptor
  | HsAddDataMickaLayerDescriptor;

/**
WHAT ABOUT THESE??
useTiles: boolean;
featureId?: string;
 */
