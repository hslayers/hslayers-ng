export interface HsLaymanLayerDescriptor {
  wms?: any;
  wfs?: any;
  name?: any;
  file?: {
    error?: {
      code?: number;
      message?: string;
    };
  };
  code?: any;
  exists?: boolean;
}
