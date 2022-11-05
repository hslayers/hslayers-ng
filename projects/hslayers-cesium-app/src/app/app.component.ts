import {
  Component,
  ComponentFactoryResolver,
  ElementRef,
  Input,
  OnInit,
} from '@angular/core';

import * as proj from 'ol/proj';
import {GeoJSON} from 'ol/format';
import {Vector as VectorLayer} from 'ol/layer';
import {View} from 'ol';
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
  id;
  constructor(
    public HsConfig: HsConfig,
    private HsCesiumConfig: HsCesiumConfig,
    private HsLayoutService: HsLayoutService,
    private componentFactoryResolver: ComponentFactoryResolver, 
    private elementRef: ElementRef
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
    } else {
      this.id = 'default';
    }
    let globFunctions = 'hslayersCesiumConfig' + this.id;
    if (w['hslayersNgConfig' + this.id]) {
      const cfg = eval('w.hslayersNgConfig' + this.id + '(w.ol, this.id)');
      this.HsConfig.update(cfg, this.id);
    } else if (this.id == 'default'){
      globFunctions = 'hslayersNgConfig' + this.id;
      if (w[globFunctions]) {
        const cfg = eval(globFunctions + '(w.ol, this.id)');
        this.HsCesiumConfig.update(cfg, this.id);
      }
    }

    globFunctions = 'hslayersCesiumConfig' + this.id;
    if (w[globFunctions]) {
      const cfg = eval(globFunctions + '(w.ol, this.id)');
      this.HsCesiumConfig.update(cfg, this.id);
    } else if (this.id == 'default') {
      globFunctions = 'hslayersCesiumConfig' + this.id;
      if (w[globFunctions]) {
        const cfg = eval(globFunctions + '(w.ol, this.id)');
        this.HsCesiumConfig.update(cfg, this.id);
      }
    }

    if (!this.HsCesiumConfig.get(this.id).cesiumBase) {
      this.HsCesiumConfig.get(this.id).cesiumBase =
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
