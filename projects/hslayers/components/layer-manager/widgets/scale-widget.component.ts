import {Component, inject, signal, WritableSignal, OnInit} from '@angular/core';

import {METERS_PER_UNIT} from 'ol/proj';

import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';
import {HsMapService} from 'hslayers-ng/services/map';
import {calculateResolutionFromScale} from 'hslayers-ng/services/utils';
import {HsLanguageService} from 'hslayers-ng/services/language';

@Component({
  selector: 'hs-scale-widget',
  templateUrl: './scale-widget.component.html',
  standalone: false,
})
export class HsScaleWidgetComponent
  extends HsLayerEditorWidgetBaseComponent
  implements OnInit {
  hsMapService = inject(HsMapService);
  hsLanguageService = inject(HsLanguageService);

  name = 'scale-widget';

  scaleEnabled: WritableSignal<boolean> = signal(false);

  ngOnInit() {
    super.ngOnInit();
    this.scaleEnabled.set(this.isScaleVisible());

    // Store initial valid values if they exist
    this.storeLastValidScaleValues();
  }

  toggle() {
    this.scaleEnabled.update((value) => !value);

    if (!this.scaleEnabled()) {
      this.storeLastValidScaleValues();
      this.minResolution = 0;
      this.maxResolution = Infinity;
    } else {
      this.restoreLastValidScaleValues();
    }
  }

  private storeLastValidScaleValues() {
    if (!this.olLayer) {
      return;
    }

    if (this.minResolutionValid()) {
      const currentMinScale = this.minResolution;
      if (currentMinScale && currentMinScale !== 0) {
        this.olLayer.set('lastValidMinResolution', currentMinScale);
      }
    }

    if (this.maxResolutionValid()) {
      const currentMaxScale = this.maxResolution;
      if (currentMaxScale && currentMaxScale !== Infinity) {
        this.olLayer.set('lastValidMaxResolution', currentMaxScale);
      }
    }
  }

  private restoreLastValidScaleValues() {
    if (!this.olLayer) {
      return;
    }

    const lastValidMin = this.olLayer.get('lastValidMinResolution');
    const lastValidMax = this.olLayer.get('lastValidMaxResolution');

    this.minResolution = lastValidMin ?? 0;
    this.maxResolution = lastValidMax ?? Infinity;
  }

  placeholder = this.hsLanguageService.getTranslation('COMMON.infinity');

  /**
   * Test if selected layer has min and max resolution set
   */
  isScaleVisible(): boolean {
    return (
      !!this.olLayer && (this.minResolutionValid() || this.maxResolutionValid())
    );
  }

  /**
   * Set min resolution for selected layer
   */
  set minResolution(newValue) {
    if (!this.layerDescriptor) {
      return;
    }
    const layer = this.olLayer;
    const resolution = calculateResolutionFromScale(
      newValue,
      this.hsMapService.getMap().getView(),
    );
    layer.setMinResolution(resolution);
    if (newValue && newValue != 0) {
      layer.set('lastValidMinResolution', newValue);
    }
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
   */
  set maxResolution(newValue) {
    if (!this.layerDescriptor) {
      return;
    }
    const layer = this.olLayer;
    const resolution = calculateResolutionFromScale(
      newValue,
      this.hsMapService.getMap().getView(),
    );
    layer.setMaxResolution(resolution);
    if (newValue && newValue != Infinity) {
      layer.set('lastValidMaxResolution', newValue);
    }
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
    const minRes = this.olLayer?.getMinResolution();
    return minRes !== undefined && minRes !== 0;
  }

  maxResolutionValid(): boolean {
    const maxRes = this.olLayer?.getMaxResolution();
    return maxRes !== undefined && maxRes !== Infinity;
  }
}
