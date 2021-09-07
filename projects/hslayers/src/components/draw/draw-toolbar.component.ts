import {Component} from '@angular/core';

import {HsConfig} from '../../config.service';
import {HsDrawService} from './draw.service';
import {HsLanguageService} from './../language/language.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsToolbarPanelBaseComponent} from '../toolbar/toolbar-panel-base.component';
import {getTitle} from '../../common/layer-extensions';

@Component({
  selector: 'hs-draw-toolbar',
  templateUrl: './partials/draw-toolbar.html',
})
export class HsDrawToolbarComponent extends HsToolbarPanelBaseComponent {
  drawToolbarExpanded = false;
  layersExpanded: boolean;
  drawTypeExpanded = false;
  selectionMenuExpanded = false;
  onlyMineFilterVisible = false;
  getTitle = getTitle;
  isVisible(): boolean {
    return true;
  }
  constructor(
    public HsDrawService: HsDrawService,
    public HsLayoutService: HsLayoutService,
    public HsLayerUtilsService: HsLayerUtilsService, //Used in template
    public HsConfig: HsConfig,
    public HsLanguageService: HsLanguageService
  ) {
    super(HsLayoutService);
  }

  translateString(module: string, text: string): string {
    return this.HsLanguageService.getTranslationIgnoreNonExisting(module, text);
  }

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
