import {Layer} from 'ol/layer';
import {SafeHtml} from '@angular/platform-browser';
import {Source} from 'ol/source';

export interface HsLegendDescriptor {
  autoLegend?: boolean;
  lyr: Layer<Source, any>;
  title: string;
  type: string;
  subLayerLegends?: Array<string>;
  visible: boolean;
  svg?: SafeHtml;
}
