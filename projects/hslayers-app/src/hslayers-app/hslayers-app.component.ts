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

import {HsConfig} from 'hslayers-ng/config';
import {HsOverlayConstructorService} from 'hslayers-ng/services/panel-constructor';
import {HsPanelConstructorService} from 'hslayers-ng/services/panel-constructor';
import {InterpolatedSource} from 'hslayers-ng/common/layers';
import {SparqlJson} from 'hslayers-ng/common/layers';

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

  id;

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
