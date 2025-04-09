import {Geometry} from 'ol/geom';
import {Feature} from 'ol/index';

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
