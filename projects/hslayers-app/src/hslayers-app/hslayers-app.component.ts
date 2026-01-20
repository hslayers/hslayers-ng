import * as proj from 'ol/proj';

import {Component, ElementRef, inject} from '@angular/core';

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

import {HsConfig, HsConfigObject} from 'hslayers-ng/config';
import {
  HsOverlayConstructorService,
  HsPanelConstructorService,
} from 'hslayers-ng/services/panel-constructor';
import {InterpolatedSource, SparqlJson} from 'hslayers-ng/common/layers';
import {
  HsLayerManagerService,
  HsLayerManagerVisibilityService,
} from 'hslayers-ng/services/layer-manager';
import {HsLayerDescriptor} from 'hslayers-ng/types';

export type HslayersNgExternalApi = {
  changeLayerVisibility: (
    layerDescriptor: HsLayerDescriptor,
    visible: boolean,
  ) => void;
  getLayerByTitle: (title: string) => HsLayerDescriptor | undefined;
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
  }
  title = 'hslayers-workspace';
}
