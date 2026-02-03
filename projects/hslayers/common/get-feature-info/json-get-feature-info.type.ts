import type {GeoJSONFeature} from 'ol/format/GeoJSON';

export type jsonGetFeatureInfo = {
  bbox?: number[];
  crs?: unknown;
  features?: GeoJSONFeature[];
  numberReturned?: number;
  timeStamp?: string;
  totalFeatures?: string | number;
  type?: string;
};
