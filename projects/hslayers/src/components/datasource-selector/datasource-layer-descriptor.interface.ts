export interface HsDatasourceLayerDescriptor {
  abstract?: string;
  formats?;
  name?: string;
  serviceType?;
  thumbnail?;
  title?: string;
  trida?;
  type: string;
  wms?: {
    url;
  };
  endpoint?;
}
