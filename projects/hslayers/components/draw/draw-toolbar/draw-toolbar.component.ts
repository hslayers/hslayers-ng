import {CommonModule} from '@angular/common';
import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslatePipe} from '@ngx-translate/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsDrawPanelComponent} from '../draw-panel/draw-panel.component';
import {HsDrawService} from 'hslayers-ng/services/draw';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsGuiOverlayBaseComponent} from 'hslayers-ng/common/panels';
import {HsMapService} from 'hslayers-ng/services/map';
import {getTitle} from 'hslayers-ng/common/extensions';
import {isLayerDrawable} from 'hslayers-ng/services/utils';

@Component({
  selector: 'hs-draw-toolbar',
  templateUrl: './draw-toolbar.component.html',
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
    TranslatePipe,
    HsDrawPanelComponent,
  ],
})
export class HsDrawToolbarComponent extends HsGuiOverlayBaseComponent {
  hsDrawService = inject(HsDrawService);
  private hsMapService = inject(HsMapService);
  private hsEventBusService = inject(HsEventBusService);

  drawToolbarExpanded = false;
  onlyMineFilterVisible = false;
  name = 'drawToolbar';
  getTitle = getTitle;

  constructor() {
    super();
    /**
     * Add listener for initial layers
     */
    this.hsMapService.getLayersArray().forEach((l) => {
      if (isLayerDrawable(l, {checkVisible: false})) {
        this.addVisibilityChangeListener(l);
      }
    });

    /**
     * Add listener for layers added to map later on
     */
    this.hsEventBusService.mapEventHandlersSet.subscribe(() => {
      this.hsMapService.map.getLayers().on('add', (e) => {
        if (isLayerDrawable(e.element as Layer<Source>)) {
          this.addVisibilityChangeListener(e.element as Layer<Source>);
        }
      });
    });
  }

  /**
   * Add listener for layer visibility change
   * @param layer - Layer to listen to
   */
  addVisibilityChangeListener(layer: Layer<Source>) {
    layer.on('change:visible', (e) => {
      if (this.drawToolbarExpanded) {
        this.hsDrawService.fillDrawableLayers();
      }
    });
  }

  selectionMenuToggled(): void {
    this.setType(this.hsDrawService.type);
  }

  toggleDrawToolbar(): void {
    this.hsDrawService.highlightDrawButton = false;
    if (
      this.hsLayoutService.layoutElement.clientWidth > 767 &&
      this.hsLayoutService.layoutElement.clientWidth < 870 &&
      !this.drawToolbarExpanded
    ) {
      this.hsLayoutService.sidebarExpanded = false;
    }
    this.drawToolbarExpanded = !this.drawToolbarExpanded;
    if (!this.drawToolbarExpanded) {
      this.hsDrawService.stopDrawing();
    } else {
      this.hsDrawService.fillDrawableLayers();
    }
  }

  selectLayer(layer): void {
    this.hsDrawService.selectLayer(layer);
  }

  controlLayerListAction() {
    if (
      !this.hsDrawService.hasSomeDrawables &&
      this.hsDrawService.tmpDrawLayer
    ) {
      this.hsDrawService.saveDrawingLayer();
    }
  }

  setType(what): void {
    const type = this.hsDrawService.setType(what);
    if (type) {
      this.hsDrawService.activateDrawing({});
    }
  }

  finishDrawing(): void {
    this.hsDrawService.stopDrawing();
  }
}
