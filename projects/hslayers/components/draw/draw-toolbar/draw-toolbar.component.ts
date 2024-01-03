import {CommonModule} from '@angular/common';
import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsConfig} from 'hslayers-ng/config';
import {HsDrawService} from '../draw.service';
import {HsGuiOverlayBaseComponent} from '../../layout/panels/gui-overlay-base.component';
import {HsLanguageService} from 'hslayers-ng/components/language';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsLayoutService} from 'hslayers-ng/components/layout';
import {HsRemoveLayerDialogService} from 'hslayers-ng/common/remove-multiple';
import {TranslateCustomPipe} from 'hslayers-ng/components/language';
import {getTitle} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-draw-toolbar',
  templateUrl: './draw-toolbar.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbDropdownModule, TranslateCustomPipe],
})
export class HsDrawToolbarComponent extends HsGuiOverlayBaseComponent {
  drawToolbarExpanded = false;
  onlyMineFilterVisible = false;
  name = 'drawToolbar';
  getTitle = getTitle;
  constructor(
    public HsDrawService: HsDrawService,
    public HsLayoutService: HsLayoutService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsConfig: HsConfig,
    public HsLanguageService: HsLanguageService,
    public HsRemoveLayerDialogService: HsRemoveLayerDialogService,
  ) {
    super(HsLayoutService);
  }
  selectionMenuToggled(): void {
    this.setType(this.HsDrawService.type);
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
  }

  controlLayerListAction() {
    if (
      !this.HsDrawService.hasSomeDrawables &&
      this.HsDrawService.tmpDrawLayer
    ) {
      this.HsDrawService.saveDrawingLayer();
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
