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
import {register as projRegister} from 'ol/proj/proj4';

import {HsCesiumConfig, HslayersCesiumComponent} from 'hslayers-cesium';
import {HsConfig} from 'hslayers-ng/config';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {
  HsOverlayConstructorService,
  HsPanelConstructorService,
} from 'hslayers-ng/services/panel-constructor';
import {InterpolatedSource} from 'hslayers-ng/common/layers';
import {SparqlJson} from 'hslayers-ng/common/layers';

@Component({
  selector: 'hslayers-cesium-app',
  templateUrl: './app.component.html',
  styleUrls: [],
})
export class AppComponent implements OnInit {
  id = '';
  constructor(
    private elementRef: ElementRef,
    public hsConfig: HsConfig,
    private hsCesiumConfig: HsCesiumConfig,
    private hsLayoutService: HsLayoutService,
    private hsOverlayConstructorService: HsOverlayConstructorService,
    private hsPanelConstructorService: HsPanelConstructorService,
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
        InterpolatedSource,
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
      projRegister,
    };

    if (this.elementRef.nativeElement.id) {
      this.id = this.elementRef.nativeElement.id;
    }
    let globFunctions = 'hslayersNgConfig' + this.id;
    if (w[globFunctions]) {
      const cfg = eval(`w.${globFunctions}(w.ol)`);
      this.hsConfig.update(cfg);
    }

    globFunctions = 'hslayersCesiumConfig' + this.id;
    if (w[globFunctions]) {
      const cfg = eval(`w.${globFunctions}(w.ol)`);
      this.hsCesiumConfig.update(cfg);
    }

    if (!this.hsCesiumConfig.cesiumBase) {
      this.hsCesiumConfig.cesiumBase =
        'node_modules/hslayers-cesium-app/assets/cesium/';
    }
  }
  title = 'hslayers-workspace';

  ngOnInit(): void {
    /**
     * Create panel components
     */
    this.hsPanelConstructorService.createActivePanels();

    /**
     * Create GUI overlay
     */
    this.hsOverlayConstructorService.createGuiOverlay();
    this.hsLayoutService.addMapVisualizer(HslayersCesiumComponent);
  }
}
