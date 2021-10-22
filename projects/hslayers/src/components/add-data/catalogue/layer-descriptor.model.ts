export interface HsAddDataLayerDescriptor {
  abstract?: string;
  formats?;
  name?: string;
  serviceType?;
  thumbnail?;
  title?: string;
  trida?;
  type: string;
  links?;
  wms?: {
    url;
  };
  endpoint?;
  id?;
  workspace?: string;
  editable?: boolean;
  sld?: {
    url: string;
  };
  featureId?: string;
  highlighted?: boolean
}
