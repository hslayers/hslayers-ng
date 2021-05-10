import {Component, OnInit} from '@angular/core';

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
  Group,
  Image as ImageLayer,
  Tile,
  Vector as VectorLayer,
} from 'ol/layer';

import {HsConfig, HsLayoutService, SparqlJson} from 'hslayers-ng';

@Component({
  selector: 'hslayers-material-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
})
export class AppComponent implements OnInit {
  constructor(
    public HsConfig: HsConfig,
    public HsLayoutService: HsLayoutService
  ) {
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
      Object.assign(this.HsConfig, w.hslayersNgConfig(w.ol));
    }
  }
  title = 'hslayers-material-app';

  ngOnInit(): void {
    this.HsLayoutService.setDefaultPanel('layermanager');
  }
}
