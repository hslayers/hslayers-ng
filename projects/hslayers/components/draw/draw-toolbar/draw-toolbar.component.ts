import {CommonModule} from '@angular/common';
import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsConfig} from 'hslayers-ng/config';
import {HsDrawPanelComponent} from '../draw-panel/draw-panel.component';
import {HsDrawService} from 'hslayers-ng/services/draw';
import {HsGuiOverlayBaseComponent} from 'hslayers-ng/common/panels';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {getTitle} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-draw-toolbar',
  templateUrl: './draw-toolbar.component.html',
  standalone: true,
  styles: `
    :host {
      position: relative;
      display: block;
    }

    .draw-panel-popup {
      position: absolute;
      top: calc(100% + 14px);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      z-index: 1000;
    }

    .draw-panel-popup::before {
      content: '';
      position: absolute;
      top: -12px;
      left: 10px;
      border-width: 0 10px 10px 10px;
      border-style: solid;
      border-color: transparent transparent white transparent;
    }
  `,
  imports: [
    CommonModule,
    FormsModule,
    NgbDropdownModule,
    TranslateCustomPipe,
    HsDrawPanelComponent,
  ],
})
export class HsDrawToolbarComponent extends HsGuiOverlayBaseComponent {
  drawToolbarExpanded = false;
  onlyMineFilterVisible = false;
  name = 'drawToolbar';
  getTitle = getTitle;
  constructor(
    public HsDrawService: HsDrawService,
    public HsConfig: HsConfig,
  ) {
    super();
  }
  selectionMenuToggled(): void {
    this.setType(this.HsDrawService.type);
  }

  toggleDrawToolbar(): void {
    this.HsDrawService.highlightDrawButton = false;
    if (
      this.hsLayoutService.layoutElement.clientWidth > 767 &&
      this.hsLayoutService.layoutElement.clientWidth < 870 &&
      !this.drawToolbarExpanded
    ) {
      this.hsLayoutService.sidebarExpanded = false;
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
