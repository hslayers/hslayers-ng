import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';

export type HsFeatureAttribute = {
  name;
  value;
  sanitizedValue?;
};

export type HsFeatureDescriptor = {
  name: string;
  feature: Feature<Geometry>;
  attributes: HsFeatureAttribute[];
  stats: any[];
  layer?: string;
  hstemplate?: any;
};
