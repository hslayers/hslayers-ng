export type layerOptions = {
  //Common
  extent?: string[];
  layerName?: string; //TODO?: name
  title?: string;
  abstract?: string;
  path?: string; //folder
  showInLayerManager?: false;
  removable?: boolean;
  fromComposition?: boolean;
  greyscale?: boolean;
  cluster?: boolean;
  style?: string;
  sld?: string;
  qml?: string;
  subLayers?: string;
  crs?: string;
  opacity?: number;

  //WMS
  base?: boolean;
  imageFormat?: string;
  queryFormat?: string;
  tileSize?;
  info_format?: string;
  attribution?: string[];
  url?: string;
  projection?: string; //TODO: CRS??
  ratio?: string;
  singleTile?: boolean;
  metadata?: any;
  legends?: string[];
  params?: {
    LAYERS: string;
    INFO_FORMAT: string;
    FORMAT: string;
    VERSION: string;
    STYLES: string;
  };
  maxResolution?: number;
  minResolution?: number;
  dimensions?: any; //TODO: dimensions type?
  //WMTS
  matrixSet?: string;
  format?: string;
};
