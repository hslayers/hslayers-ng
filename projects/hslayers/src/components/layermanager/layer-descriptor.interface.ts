import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

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
  galleryMiniMenu?: boolean;
  loadProgress?: HsLayerLoadProgress;
  layer: Layer<Source>;
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
  source?: string;
  time?: HsLayerTimeDescriptor;
  /**
   * OL source class of this layer, in case of 'vector' also with format (e.g. 'vector (KML)')
   */
  type?: string;
  grayscale?: boolean;
}
