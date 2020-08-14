import {Layer} from 'ol/layer';

export interface HsLegendDescriptor {
  lyr: Layer;
  title: string;
  type: string;
  subLayerLegends?: Array<string>;
  visible: boolean;
}
