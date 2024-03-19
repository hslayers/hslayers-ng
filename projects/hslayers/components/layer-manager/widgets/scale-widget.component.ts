import {Component} from '@angular/core';

import {METERS_PER_UNIT} from 'ol/proj';

import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';
import {HsLayerSelectorService} from 'hslayers-ng/services/layer-manager';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsMapService} from 'hslayers-ng/services/map';

@Component({
  selector: 'hs-scale-widget',
  templateUrl: './scale-widget.component.html',
})
export class HsScaleWidgetComponent extends HsLayerEditorWidgetBaseComponent {
  name = 'scale-widget';

  constructor(
    hsLayerSelectorService: HsLayerSelectorService,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsMapService: HsMapService,
  ) {
    super(hsLayerSelectorService);
  }

  /**
   * Test if selected layer has min and max resolution set
   */
  isScaleVisible(): boolean {
    const layer = this.olLayer;
    if (layer == undefined) {
      return false;
    }
    return this.minResolutionValid() || this.maxResolutionValid();
  }

  /**
   * Set min resolution for selected layer
   * @param newValue
   */
  set minResolution(newValue) {
    if (!this.layerDescriptor) {
      return;
    }
    const layer = this.olLayer;
    layer.setMinResolution(
      this.hsLayerUtilsService.calculateResolutionFromScale(
        newValue,
        this.hsMapService.getMap().getView(),
      ),
    );
  }

  get minResolution() {
    if (!this.layerDescriptor) {
      return;
    }
    const layer = this.olLayer;
    return this.resolutionToScale(layer.getMinResolution());
  }

  /**
   * Set max resolution for selected layer
   * @param newValue
   */
  set maxResolution(newValue) {
    if (!this.layerDescriptor) {
      return;
    }
    const layer = this.olLayer;
    layer.setMaxResolution(
      this.hsLayerUtilsService.calculateResolutionFromScale(
        newValue,
        this.hsMapService.getMap().getView(),
      ),
    );
  }

  get maxResolution() {
    if (!this.layerDescriptor) {
      return;
    }
    const layer = this.olLayer;
    return this.resolutionToScale(layer.getMaxResolution());
  }

  resolutionToScale(resolution) {
    const view = this.hsMapService.getMap().getView();
    const units = view.getProjection().getUnits();
    const dpi = 25.4 / 0.28;
    const mpu = METERS_PER_UNIT[units];
    return Math.round(resolution * mpu * 39.37 * dpi);
  }

  minResolutionValid(): boolean {
    const layer = this.olLayer;
    if (layer == undefined) {
      return false;
    }
    return (
      layer.getMinResolution() != undefined && layer.getMinResolution() != 0
    );
  }

  maxResolutionValid(): boolean {
    const layer = this.olLayer;
    if (layer == undefined) {
      return false;
    }
    return (
      layer.getMaxResolution() != undefined &&
      layer.getMaxResolution() != Infinity
    );
  }
}
