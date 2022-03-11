import {
  Component,
  ComponentFactoryResolver,
  Input,
  OnInit,
} from '@angular/core';

import * as proj from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import View from 'ol/View';
import {BingMaps, OSM, TileArcGISRest, TileWMS, WMTS, XYZ} from 'ol/source';
import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';
import {Group, Image as ImageLayer, Tile} from 'ol/layer';
import {HsCesiumConfig, HslayersCesiumComponent} from 'hslayers-cesium';
import {HsConfig} from 'hslayers-ng';
import {HsLayoutService} from 'hslayers-ng';
import {ImageArcGISRest, ImageWMS} from 'ol/source';
import {Vector} from 'ol/source';

@Component({
  selector: 'hslayers-cesium-app',
  templateUrl: './app.component.html',
  styleUrls: [],
})
export class AppComponent implements OnInit {
  @Input() app = 'cesium';
  constructor(
    public HsConfig: HsConfig,
    private HsCesiumConfig: HsCesiumConfig,
    private HsLayoutService: HsLayoutService,
    private componentFactoryResolver: ComponentFactoryResolver
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

    if (w.hslayersNgConfig) {
      this.HsConfig.update(w.hslayersNgConfig(w.ol), this.app);
    }

    if (w.hslayersCesiumConfig) {
      this.HsCesiumConfig.update(w.hslayersCesiumConfig(), this.app);
    }

    if (!this.HsCesiumConfig.get(this.app).cesiumBase) {
      this.HsCesiumConfig.get(this.app).cesiumBase =
        'node_modules/hslayers-cesium-app/assets/cesium/';
    }
  }
  title = 'hslayers-workspace';

  ngOnInit(): void {
    const componentFactory =
      this.componentFactoryResolver.resolveComponentFactory(
        HslayersCesiumComponent
      );

    this.HsLayoutService.mapSpaceRef.subscribe(({viewContainerRef, app}) => {
      if (viewContainerRef) {
        viewContainerRef.createComponent(componentFactory);
      }
    });
  }
}
