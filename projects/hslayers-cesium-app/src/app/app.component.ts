import * as proj from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import View from 'ol/View';
import {BingMaps, OSM, TileArcGISRest, TileWMS, WMTS, XYZ} from 'ol/source';
import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';
import {Component, ComponentFactoryResolver} from '@angular/core';
import {Group, Image as ImageLayer, Tile} from 'ol/layer';
import {HsCesiumComponent} from 'hslayers-cesium';
import {HsConfig} from 'hslayers-ng';
import {HsLayoutService} from 'hslayers-ng';
import {ImageArcGISRest, ImageWMS} from 'ol/source';
import {Vector} from 'ol/source';

@Component({
  selector: 'hs-app',
  templateUrl: './app.component.html',
  styleUrls: [],
})
export class AppComponent {
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
  title = 'hslayers-workspace';

  ngOnInit(): void {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
      HsCesiumComponent
    );

    this.HsLayoutService.mapSpaceRef.subscribe((mapSpace) => {
      if (mapSpace) {
        mapSpace.createComponent(componentFactory);
      }
    });
  }
}
