import {CommonModule} from '@angular/common';
import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsDrawPanelComponent} from '../draw-panel/draw-panel.component';
import {HsDrawService} from 'hslayers-ng/services/draw';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsGuiOverlayBaseComponent} from 'hslayers-ng/common/panels';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsMapService} from 'hslayers-ng/services/map';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
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
    public hsDrawService: HsDrawService,
    private hsMapService: HsMapService,
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsEventBusService: HsEventBusService,
  ) {
    super();

    /**
     * Add listener for initial layers
     */
    this.hsMapService.getLayersArray().forEach((l) => {
      if (this.hsLayerUtilsService.isLayerDrawable(l, {checkVisible: false})) {
        this.addVisibilityChangeListener(l);
      }
    });

    /**
     * Add listener for layers added to map later on
     */
    this.hsEventBusService.mapEventHandlersSet.subscribe(() => {
      this.hsMapService.map.getLayers().on('add', (e) => {
        if (
          this.hsLayerUtilsService.isLayerDrawable(e.element as Layer<Source>)
        ) {
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
