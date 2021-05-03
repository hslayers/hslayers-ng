import {Layer} from 'ol/layer';

export type HsLayerTimeDescriptor = {
  default: string;
  timePoints: Array<string>;
};

export type HsLayerLoadProgress = {
  loadCounter: number;
  loadTotal: number;
  loadError: number;
  percents: number;
  loaded: boolean;
  error?: boolean;
  timer?: any;
};

export interface HsLayerDescriptor {
  loadProgress?: HsLayerLoadProgress;
  layer: Layer;
  abstract?: string;
  legends?: string | string[];
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
  time?: HsLayerTimeDescriptor;
  grayscale?: boolean;
}
