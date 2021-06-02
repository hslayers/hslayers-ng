import {Layer} from 'ol/layer';

export interface HsLegendDescriptor {
  autoLegend?: boolean;
  lyr: Layer;
  title: string;
  type: string;
  subLayerLegends?: Array<string>;
  visible: boolean;
}
