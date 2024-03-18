export type ArcGISRestResponseLayer = {
  defaultVisibility?: boolean; //FIXME: unused
  geometryType: string; //FIXME: unused
  id: number;
  maxScale: number; //FIXME: unused
  minScale: number; //FIXME: unused
  name: string; //FIXME: unused
  parentLayerId: number; //FIXME: unused
  subLayerIds: number[]; //FIXME: unused
  type: string; //FIXME: unused
};

export type ArcGISRestResponseLayerExtent = {
  spatialReference?: any;
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
};
