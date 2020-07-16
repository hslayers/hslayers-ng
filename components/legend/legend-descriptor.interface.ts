import BaseLayer from 'ol/layer/Base';
export interface HsLegendDescriptor {
  lyr: BaseLayer;
  title: string;
  type: string;
  subLayerLegends?: Array<string>;
  visible: boolean;
}
