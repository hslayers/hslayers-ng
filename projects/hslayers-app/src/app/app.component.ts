import * as proj from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import View from 'ol/View';
import {BingMaps, OSM, TileArcGISRest, TileWMS, WMTS, XYZ} from 'ol/source';
import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';
import {Component} from '@angular/core';
import {Group, Image as ImageLayer, Tile} from 'ol/layer';
import {HsConfig} from '../../../hslayers/src/config.service';
import {ImageArcGISRest, ImageWMS} from 'ol/source';
import {Vector} from 'ol/source';

@Component({
  selector: 'hs-app',
  templateUrl: './app.component.html',
  styleUrls: [],
})
export class AppComponent {
  constructor(public HsConfig: HsConfig) {
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

    if (w.hslayersNgConfig) {
      Object.assign(this.HsConfig, w.hslayersNgConfig(w.ol));
    }
  }
  title = 'hslayers demo';
}
