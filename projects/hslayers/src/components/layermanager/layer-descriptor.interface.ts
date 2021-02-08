import {Layer} from 'ol/layer';

export interface HsLayerDescriptor {
  layer: Layer;
  active?: boolean;
  grayed?: boolean;
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
  date_from?: any;
  date_till?: any;
  date_format?: any;
  grayscale?: boolean;
  time_step?: number;
  min_time?: number;
  max_time?: number;
}
