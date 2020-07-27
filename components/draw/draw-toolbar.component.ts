import {Component} from '@angular/core';

import Vector from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';

import {HsDrawService} from './draw.service';
import {HsLayoutService} from '../layout/layout.service';

@Component({
  selector: 'hs-draw-toolbar',
  template: require('./partials/draw-toolbar.html'),
})
export class HsDrawToolbarComponent {
  drawToolbarExpanded = false;
  layersExpanded: boolean;
  constructor(
    private HsDrawService: HsDrawService,
    private HsLayoutService: HsLayoutService
  ) {}

  toggleDrawToolbar(e): void {
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

  selectLayer(layer): void {
    if (layer != this.HsDrawService.selectedLayer) {
      this.HsDrawService.selectedLayer = layer;
      this.HsDrawService.changeDrawSource();
    }
    this.layersExpanded = false;
  }

  setType(what): void {
    const type = this.HsDrawService.setType(what);
    if (type) {
      this.HsDrawService.activateDrawing({});
    }
  }

  finishDrawing(): void {
    this.HsDrawService.draw.finishDrawing();
  }
}
