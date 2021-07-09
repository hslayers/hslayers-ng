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
import {Component} from '@angular/core';
import {
  Group,
  Image as ImageLayer,
  Tile,
  Vector as VectorLayer,
} from 'ol/layer';

import SparqlJson from '../../../hslayers/src/common/layers/hs.source.SparqlJson';
import {HsConfig} from '../../../hslayers/src/config.service';

@Component({
  selector: 'hslayers-app',
  templateUrl: './hslayers-app.component.html',
  styleUrls: [],
})
export class HslayersAppComponent {
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

    if (w.hslayersNgConfig) {
      const updatedConfig = w.hslayersNgConfig(w.ol);
      if (updatedConfig.assetsPath != undefined && updatedConfig.symbolizerIcons == undefined) {
        updatedConfig.symbolizerIcons = [
          {name: 'favourite', url: `${updatedConfig.assetsPath}/img/icons/favourite28.svg`},
          {name: 'gps', url: `${updatedConfig.assetsPath}/img/icons/gps43.svg`},
          {name: 'information', url: `${updatedConfig.assetsPath}/img/icons/information78.svg`},
          {name: 'wifi', url: `${updatedConfig.assetsPath}/img/icons/wifi8.svg`},
        ];
      }
      Object.assign(this.HsConfig, updatedConfig);
    }
  }
  title = 'hslayers-workspace';
}
