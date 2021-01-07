import Feature from 'ol/Feature';

export type HsVectorLayerOptions = {
  opacity?: number;
  visible?: boolean;
  path?: string;
  from_composition?: boolean;
  style?: any;
  extractStyles?: boolean;
  features?: Feature[];
};
