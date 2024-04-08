import {Component, ElementRef, OnInit} from '@angular/core';

import * as proj from 'ol/proj';
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
import {GeoJSON} from 'ol/format';
import {
  Group,
  Image as ImageLayer,
  Tile,
  Vector as VectorLayer,
} from 'ol/layer';
import {View} from 'ol';

import {HsCesiumConfig, HslayersCesiumComponent} from 'hslayers-cesium';
import {HsConfig} from 'hslayers-ng/config';
import {HsLayoutService} from 'hslayers-ng/services/layout';

@Component({
  selector: 'hslayers-cesium-app',
  templateUrl: './app.component.html',
  styleUrls: [],
})
export class AppComponent implements OnInit {
  id = '';
  constructor(
    public HsConfig: HsConfig,
    private HsCesiumConfig: HsCesiumConfig,
    private HsLayoutService: HsLayoutService,
    private elementRef: ElementRef,
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
    }
    let globFunctions = 'hslayersNgConfig' + this.id;
    if (w[globFunctions]) {
      const cfg = eval(`w.${globFunctions}(w.ol)`);
      this.HsConfig.update(cfg);
    }

    globFunctions = 'hslayersCesiumConfig' + this.id;
    if (w[globFunctions]) {
      const cfg = eval(`w.${globFunctions}(w.ol)`);
      this.HsCesiumConfig.update(cfg);
    }

    if (!this.HsCesiumConfig.cesiumBase) {
      this.HsCesiumConfig.cesiumBase =
        'node_modules/hslayers-cesium-app/assets/cesium/';
    }
  }
  title = 'hslayers-workspace';

  ngOnInit(): void {
    this.HsLayoutService.mapSpaceRef.subscribe((viewContainerRef) => {
      if (viewContainerRef) {
        viewContainerRef.createComponent(HslayersCesiumComponent);
      }
    });
  }
}
