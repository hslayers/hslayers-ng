import {SafeHtml} from '@angular/platform-browser';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

export interface HsLegendDescriptor {
  autoLegend?: boolean;
  lyr: Layer<Source>;
  title: string;
  type: string;
  subLayerLegends?: Array<string>;
  visible: boolean;
  svg?: SafeHtml;
}
