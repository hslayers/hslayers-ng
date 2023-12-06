import {CommonModule} from '@angular/common';
import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsConfig} from '../../../config.service';
import {HsDrawService} from '../draw.service';
import {HsGuiOverlayBaseComponent} from '../../layout/panels/gui-overlay-base.component';
import {HsLanguageService} from '../../language/language.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsRemoveLayerDialogService} from '../../../common/remove-multiple/remove-layer-dialog.service';
import {TranslateCustomPipe} from '../../language/translate-custom.pipe';
import {getTitle} from '../../../common/layer-extensions';

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
