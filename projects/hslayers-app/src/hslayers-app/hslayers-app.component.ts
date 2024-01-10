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
import {Component, ElementRef} from '@angular/core';
import {GeoJSON} from 'ol/format';
import {
  Group,
  Image as ImageLayer,
  Tile,
  Vector as VectorLayer,
} from 'ol/layer';
import {View} from 'ol';
import {register as projRegister} from 'ol/proj/proj4';

import {HsConfig} from 'hslayers-ng/config';
//import {HsOverlayPanelContainerService} from '@hslayers-ng/components/layout/overlay-panel-container.service';
import {HsPanelConstructorService} from 'hslayers-ng/shared/panel-constructor';
import {InterpolatedSource} from 'hslayers-ng/common/layers';
import {SparqlJson} from 'hslayers-ng/common/layers';

@Component({
  selector: 'hslayers-app',
  templateUrl: './hslayers-app.component.html',
  styleUrls: [],
})
export class HslayersAppComponent {
  id;
  constructor(
    public HsConfig: HsConfig,
    private elementRef: ElementRef,
    //private HsOverlayPanelContainerService: HsOverlayPanelContainerService,
    private HsPanelConstructorService: HsPanelConstructorService,
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
    if (w['hslayersNgConfig' + this.id]) {
      const cfg = eval('w.hslayersNgConfig' + this.id + '(w.ol)');
      this.HsConfig.update(cfg);
    } else if (w.hslayersNgConfig) {
      this.HsConfig.update(w.hslayersNgConfig(w.ol));
    }

    if (this.id) {
      this.HsConfig.setAppId(this.id);
    }
    /**
     * Create panel components
     */
    this.HsPanelConstructorService.createActivePanels();

    /**
     * Create GUI overlay
     */
    //this.HsOverlayPanelContainerService.createGuiOverlay();
  }
  title = 'hslayers-workspace';
}
