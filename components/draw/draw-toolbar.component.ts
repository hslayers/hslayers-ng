import {Component} from '@angular/core';

import Vector from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';

import {HsConfig} from '../../config.service';
import {HsDrawService} from './draw.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service.js';
import {HsMapService} from '../map/map.service.js';

@Component({
  selector: 'hs-draw-toolbar',
  template: require('./partials/draw-toolbar.html'),
})
export class HsDrawToolbarComponent {
  drawToolbarExpanded: any = false;
  layersExpanded: boolean;
  constructor(
    private HsMapService: HsMapService,
    private HsDrawService: HsDrawService,
    private HsConfig: HsConfig,
    private HsLayerUtilsService: HsLayerUtilsService,
    private HsLayoutService: HsLayoutService
  ) {}

  toggleDrawToolbar(e) {
    if (
      this.HsLayoutService.layoutElement.clientWidth > 767 &&
      this.HsLayoutService.layoutElement.clientWidth < 870 &&
      !this.drawToolbarExpanded
    ) {
      this.HsLayoutService.sidebarExpanded = false;
    }
    this.drawToolbarExpanded = !this.drawToolbarExpanded;
    if (!this.drawToolbarExpanded) {
      this.HsDrawService.stopDrawing();
    }
  }
  selectLayer(layer) {
    if (layer != this.HsDrawService.selectedLayer) {
      this.HsDrawService.selectedLayer = layer;
      this.HsDrawService.changeDrawSource();
    }
    this.layersExpanded = false;
  }

  setType(what) {
    const type = this.HsDrawService.setType(what);
    if (type) {
      this.HsDrawService.activateDrawing({});
    }
  }
  finishDrawing() {
    this.HsDrawService.draw.finishDrawing();
  }
}