import * as proj from 'ol/proj';

import {Component, ElementRef, OnInit, inject} from '@angular/core';

import BingMaps from 'ol/source/BingMaps';
import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import GeoJSON from 'ol/format/GeoJSON';
import Group from 'ol/layer/Group';
import Icon from 'ol/style/Icon';
import ImageArcGISRest from 'ol/source/ImageArcGISRest';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import OSM from 'ol/source/OSM';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Tile from 'ol/layer/Tile';
import TileArcGISRest from 'ol/source/TileArcGISRest';
import TileWMS from 'ol/source/TileWMS';
import Vector from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import View from 'ol/View';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';
import {register as projRegister} from 'ol/proj/proj4';

import {HsCesiumConfig, HslayersCesiumComponent} from 'hslayers-cesium';
import {HsConfig} from 'hslayers-ng/config';
import {HslayersComponent} from 'hslayers-ng/core';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {
  HsOverlayConstructorService,
  HsPanelConstructorService,
} from 'hslayers-ng/services/panel-constructor';
import {InterpolatedSource, SparqlJson} from 'hslayers-ng/common/layers';

@Component({
  selector: 'hslayers-cesium-app',
  templateUrl: './app.component.html',
  styleUrls: [],
  imports: [HslayersComponent],
})
export class AppComponent implements OnInit {
  private elementRef = inject(ElementRef);
  hsConfig = inject(HsConfig);
  private hsCesiumConfig = inject(HsCesiumConfig);
  private hsLayoutService = inject(HsLayoutService);
  private hsOverlayConstructorService = inject(HsOverlayConstructorService);
  private hsPanelConstructorService = inject(HsPanelConstructorService);

  id = '';

  constructor() {
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
