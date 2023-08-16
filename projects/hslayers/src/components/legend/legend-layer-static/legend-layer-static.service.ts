import {DomSanitizer} from '@angular/platform-browser';
import {Injectable} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {LayerLegend} from './types/layer-legend.type';
import {getLegends} from '../../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsLegendLayerStaticService {
  constructor(private sanitizer: DomSanitizer) {}

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
