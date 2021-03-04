import {
  Component,
  ComponentFactoryResolver,
  OnDestroy,
  OnInit,
} from '@angular/core';

import {Subscription} from 'rxjs';

import * as proj from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
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
import {Group, Image as ImageLayer, Tile} from 'ol/layer';

import {HsConfig} from 'hslayers-ng';
import {HsLayoutService} from 'hslayers-ng';
import {HslayersCesiumComponent} from 'hslayers-cesium';

@Component({
  selector: 'hslayers-cesium-app',
  templateUrl: './app.component.html',
  styleUrls: [],
})
export class AppComponent implements OnInit, OnDestroy {
  mapSpaceRefSubscription: Subscription;
  constructor(
    public HsConfig: HsConfig,
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
      Object.assign(this.HsConfig, w.hslayersNgConfig(w.ol));
    }
  }
  ngOnDestroy(): void {
    this.mapSpaceRefSubscription.unsubscribe();
  }
  title = 'hslayers-workspace';

  ngOnInit(): void {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
      HslayersCesiumComponent
    );

    this.mapSpaceRefSubscription = this.HsLayoutService.mapSpaceRef.subscribe(
      (mapSpace) => {
        if (mapSpace) {
          mapSpace.createComponent(componentFactory);
        }
      }
    );
  }
}
