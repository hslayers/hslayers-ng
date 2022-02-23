import {SafeHtml, SafeResourceUrl} from '@angular/platform-browser';

export type LayerLegend = {
  lastLegendImage?: any;
  legendType?: 'image' | 'svg';
  svgContent?: SafeHtml;
  legendImage?: SafeResourceUrl;
};
