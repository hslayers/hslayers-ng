import {DomSanitizer} from '@angular/platform-browser';
import {Injectable, inject} from '@angular/core';

import Layer from 'ol/layer/Layer';
import Source from 'ol/source/Source';

import {getLegends} from 'hslayers-ng/common/extensions';
import {LayerLegend} from './types/layer-legend.type';

@Injectable({
  providedIn: 'root',
})
export class HsLegendLayerStaticService {
  private sanitizer = inject(DomSanitizer);

  fillContent(lyr: Layer<Source>): LayerLegend {
    const layerLegend: LayerLegend = {};
    let legendImage = getLegends(lyr);
    if (Array.isArray(legendImage)) {
      legendImage = legendImage[0];
    }
    if (legendImage) {
      layerLegend.lastLegendImage = legendImage;
      if (legendImage.indexOf('<svg') > -1) {
        layerLegend.legendType = 'svg';
        layerLegend.svgContent =
          this.sanitizer.bypassSecurityTrustHtml(legendImage);
      } else {
        layerLegend.legendType = 'image';
        layerLegend.legendImage =
          this.sanitizer.bypassSecurityTrustResourceUrl(legendImage);
      }
    }
    return layerLegend;
  }
}
