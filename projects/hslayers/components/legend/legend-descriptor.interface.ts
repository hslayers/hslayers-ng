import {SafeHtml} from '@angular/platform-browser';

import Layer from 'ol/layer/Layer';
import Source from 'ol/source/Source';

export interface HsLegendDescriptor {
  autoLegend?: boolean;
  lyr: Layer<Source>;
  title: string;
  type: string;
  subLayerLegends?: Array<string>;
  visible: boolean;
  svg?: SafeHtml;
}
