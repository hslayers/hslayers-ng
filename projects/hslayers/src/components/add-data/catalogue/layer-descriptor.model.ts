export interface HsAddDataLayerDescriptor {
  abstract?: string;
  formats?;
  name?: string;
  serviceType?;
  thumbnail?;
  title?: string;
  trida?;
  type: string[];
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
  endpoint?;
  id?;
  workspace?: string;
  editable?: boolean;
  style?: {
    url?: string;
    type?: string;
  };
  featureId?: string;
  highlighted?: boolean;
}
