import * as proj from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import View from 'ol/View';
import {
  BingMaps,
  ImageArcGISRest,
  ImageWMS,
  OSM,
  TileArcGISRest,
  TileWMS,
  Vector,
  WMTS,
  XYZ,
} from 'ol/source';
import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';
import {
  Component,
  Injector,
  Input,
  Renderer2
} from '@angular/core';
import { createCustomElement } from '@angular/elements';
import {
  Group,
  Image as ImageLayer,
  Tile,
  Vector as VectorLayer,
} from 'ol/layer';

import SparqlJson from 'hslayers-ng/src/common/layers/hs.source.SparqlJson';
import {HsConfig} from 'hslayers-ng/src/config.service';

@Component({
  selector: 'hslayers-app',
  templateUrl: './hslayers-app.component.html',
  styleUrls: [],
})
export class HslayersAppComponent {

  constructor(public HsConfig: HsConfig, private renderer: Renderer2) {
    const w: any = window;
    w.ol = {
      layer: {
        Tile,
        Group,
        Image: ImageLayer,
        Vector: VectorLayer,
      },
      source: {
        OSM,
        XYZ,
        TileWMS,
        Vector,
        WMTS,
        TileArcGISRest,
        BingMaps,
        ImageWMS,
        ImageArcGISRest,
        SparqlJson,
      },
      format: {
        GeoJSON,
      },
      style: {
        Style,
        Fill,
        Stroke,
        Circle,
        Icon,
      },
      View,
      proj,
    };

    let elems = document.getElementsByTagName("hslayers-app-el");
    for (let i = 0; i < elems.length; i++) {
      var tmp = elems[i].getAttribute('config');
      if (!tmp)
        tmp = 'hslayersNgConfig';

      if (tmp in w) {
        let cfg = eval(tmp + '(w.ol)');
        HsConfig.update(cfg);
      }
    }
  }
  title = 'hslayers-workspace';
}
