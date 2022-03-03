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
import {Component, ElementRef, Input, OnInit} from '@angular/core';
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
  id;
  constructor(public HsConfig: HsConfig, private elementRef: ElementRef) {
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

    if (this.elementRef.nativeElement.id) {
      this.id = this.elementRef.nativeElement.id;
    } else {
      this.id = 'default';
    }

    if (w.hslayersNgConfig) {
      this.HsConfig.update(w.hslayersNgConfig(w.ol, this.id), this.id);
    }
  }
  title = 'hslayers-workspace';
}
