import {Component, inject, signal, WritableSignal, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {METERS_PER_UNIT} from 'ol/proj/Units';

import {calculateResolutionFromScale} from 'hslayers-ng/services/utils';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';
import {HsMapService} from 'hslayers-ng/services/map';

@Component({
  selector: 'hs-scale-widget',
  templateUrl: './scale-widget.component.html',
  styleUrls: ['./layer-editor-widgets.component.scss'],
  styles: [
    `
      .hs-scale-inputs {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .hs-scale-input-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .hs-scale-input-group label {
        margin-bottom: 0;
        font-size: 0.8125rem;
        font-weight: 500;
      }

      .hs-scale-input-group .input-group-text {
        font-size: 0.8125rem;
        font-weight: 500;
        min-width: 2rem;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.04);
        border-color: rgba(0, 0, 0, 0.15);
      }

      .hs-scale-input-group .form-control {
        font-size: 0.8125rem;
      }

      .hs-scale-input-group .form-control:focus {
        box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25);
      }

      .hs-scale-summary {
        margin-top: 0.75rem;
        padding: 0.5rem 0.625rem;
        background: rgba(var(--bs-primary-rgb), 0.08);
        border-radius: 0.25rem;
        font-size: 0.8125rem;
        color: var(--bs-primary);
        font-weight: 500;
        display: flex;
        align-items: center;
      }

      .hs-scale-summary i {
        font-size: 0.75rem;
        opacity: 0.8;
      }

      .hs-scale-summary .mx-1 {
        opacity: 0.6;
        font-weight: 400;
      }
    `,
  ],

  imports: [FormsModule, TranslatePipe],
})
export class HsScaleWidgetComponent
  extends HsLayerEditorWidgetBaseComponent
  implements OnInit
{
  hsMapService = inject(HsMapService);
  hsLanguageService = inject(HsLanguageService);

  name = 'scale-widget';

  scaleEnabled: WritableSignal<boolean> = signal(false);
  suppressCacheUpdate: boolean = false;

  ngOnInit() {
    super.ngOnInit();
    this.scaleEnabled.set(this.isScaleVisible());

    // Store initial valid values if they exist
    this.storeLastValidScaleValues();
  }

  toggle() {
    this.scaleEnabled.update((value) => !value);

    if (this.scaleEnabled()) {
      this.restoreLastValidScaleValues();
    } else {
      // Suppress cache update to avoid clearing cache
      this.suppressCacheUpdate = true;
      this.storeLastValidScaleValues();
      this.minResolution = 0;
      this.maxResolution = Infinity;
      this.suppressCacheUpdate = false;
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
   * Test if selected layer has min or max resolution set
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
    const value = newValue ?? 0;

    const resolution = calculateResolutionFromScale(
      value,
      this.hsMapService.getMap().getView(),
    );
    layer.setMinResolution(resolution);
    if (!this.suppressCacheUpdate) {
      if (value === 0) {
        layer.unset('lastValidMinResolution', true);
      } else {
        layer.set('lastValidMinResolution', value);
      }
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
    const value = newValue ?? Infinity;
    const resolution = calculateResolutionFromScale(
      value,
      this.hsMapService.getMap().getView(),
    );
    layer.setMaxResolution(resolution);
    if (!this.suppressCacheUpdate) {
      if (value === Infinity) {
        layer.unset('lastValidMaxResolution');
      } else {
        layer.set('lastValidMaxResolution', value);
      }
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
