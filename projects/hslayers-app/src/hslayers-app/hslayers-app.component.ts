import * as proj from 'ol/proj';

import {Component, ElementRef, inject} from '@angular/core';

import BingMaps from 'ol/source/BingMaps';
import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import GeoJSON from 'ol/format/GeoJSON';
import Group from 'ol/layer/Group';
import Icon from 'ol/style/Icon';
import ImageArcGISRest from 'ol/source/ImageArcGISRest';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import Map from 'ol/Map';
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

import {HsConfig, HsConfigObject} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {
  HsLayerManagerService,
  HsLayerManagerVisibilityService,
} from 'hslayers-ng/services/layer-manager';
import {HsMapService} from 'hslayers-ng/services/map';
import {
  HsOverlayConstructorService,
  HsPanelConstructorService,
} from 'hslayers-ng/services/panel-constructor';
import {InterpolatedSource, SparqlJson} from 'hslayers-ng/common/layers';

export type HslayersNgExternalApi = {
  changeLayerVisibility: (
    layerDescriptor: HsLayerDescriptor,
    visible: boolean,
  ) => void;
  getLayerByTitle: (title: string) => HsLayerDescriptor | undefined;
  getMap: () => Map;
  eventBus: HsEventBusService;
};

@Component({
  selector: 'hslayers-app',
  templateUrl: './hslayers-app.component.html',
  styleUrls: [],
  standalone: false,
})
export class HslayersAppComponent {
  hsConfig = inject(HsConfig);
  private elementRef = inject(ElementRef);
  private hsOverlayConstructorService = inject(HsOverlayConstructorService);
  private hsPanelConstructorService = inject(HsPanelConstructorService);
  private hsLayerManagerService = inject(HsLayerManagerService);
  private hsLayerManagerVisibilityService = inject(
    HsLayerManagerVisibilityService,
  );
  private hsEventBusService = inject(HsEventBusService);
  private hsMapService = inject(HsMapService);

  id;

  constructor() {
    const w = window as unknown as Record<string, unknown> & {
      ol?: unknown;
      hslayersNgConfig?: (ol: unknown) => HsConfigObject;
      hslayersNg?: HslayersNgExternalApi;
    };
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

    const api: HslayersNgExternalApi = {
      changeLayerVisibility: (layerDescriptor, visible) => {
        if (layerDescriptor) {
          this.hsLayerManagerVisibilityService.changeLayerVisibility(
            visible,
            layerDescriptor,
          );
        }
      },
      getLayerByTitle: (title) =>
        this.hsLayerManagerService.getLayerByTitle(title),
      eventBus: this.hsEventBusService,
      getMap: () => this.hsMapService.getMap(),
    };

    w[`hslayersNg${this.id || ''}`] = api;

    if (w['hslayersNgConfig' + this.id]) {
      const cfg = eval('w.hslayersNgConfig' + this.id + '(w.ol)');
      this.hsConfig.update(cfg);
    } else if (w.hslayersNgConfig) {
      this.hsConfig.update(w.hslayersNgConfig(w.ol));
    }
    /**
     * Create panel components
     */
    this.hsPanelConstructorService.createActivePanels();

    /**
     * Create GUI overlay
     */
    this.hsOverlayConstructorService.createGuiOverlay();

    window.dispatchEvent(
      new CustomEvent('hslayers.app.loaded', {
        detail: {
          element: this.elementRef.nativeElement,
          api,
        },
      }),
    );
  }
  title = 'hslayers-workspace';
}
