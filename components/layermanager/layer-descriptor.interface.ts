import {Layer} from 'ol/layer';

export interface HsLayerDescriptor {
  layer: Layer;
  active?: boolean;
  grayed?: boolean;
  hsFilters?: any;
  position?: number;
  settings?: boolean;
  sublayers?: boolean;
  thumbnail?: string;
  title?: string;
  trackBy?: string;
  uid?: string;
  visible?: boolean;
  expandFilter?: boolean;
  expandInfo?: boolean;
  idString?: any;
  time?: any; //moment?
  date_increment?: number;
}
