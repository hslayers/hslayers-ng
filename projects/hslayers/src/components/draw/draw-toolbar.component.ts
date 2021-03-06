import {Component} from '@angular/core';

import {HsDrawService} from './draw.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {getTitle} from '../../common/layer-extensions';

@Component({
  selector: 'hs-draw-toolbar',
  templateUrl: './partials/draw-toolbar.html',
})
export class HsDrawToolbarComponent {
  drawToolbarExpanded = false;
  layersExpanded: boolean;
  drawTypeExpanded = false;
  onlyMineFilterVisible = false;
  getTitle = getTitle;

  constructor(
    public HsDrawService: HsDrawService,
    public HsLayoutService: HsLayoutService,
    public HsLayerUtilsService: HsLayerUtilsService //Used in template
  ) {}

  toggleDrawToolbar(): void {
    this.HsDrawService.highlightDrawButton = false;
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
    this.HsDrawService.fillDrawableLayers();
  }
  selectLayer(layer): void {
    this.HsDrawService.selectLayer(layer);
    this.layersExpanded = false;
  }

  controlLayerListAction() {
    if (
      !this.HsDrawService.hasSomeDrawables &&
      this.HsDrawService.tmpDrawLayer
    ) {
      this.HsDrawService.saveDrawingLayer();
    } else {
      this.layersExpanded = !this.layersExpanded;
    }
  }

  setType(what): void {
    const type = this.HsDrawService.setType(what);
    if (type) {
      this.HsDrawService.activateDrawing({});
    }
  }

  finishDrawing(): void {
    this.HsDrawService.stopDrawing();
  }
}
