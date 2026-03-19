import {AsyncPipe} from '@angular/common';
import {ColormapPickerComponent} from 'hslayers-ng/common/color-map-picker';
import {Component, OnInit, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import colorScales from 'colormap/colorScale';
import Feature from 'ol/Feature';
import VectorSource from 'ol/source/Vector';

import {HsConfig} from 'hslayers-ng/config';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';
import {instOf, listNumericAttributes} from 'hslayers-ng/services/utils';
import {InterpolatedSource} from 'hslayers-ng/common/layers';

@Component({
  selector: 'hs-idw-widget',
  templateUrl: './idw-widget.component.html',
  styleUrls: ['./layer-editor-widgets.component.scss'],
  styles: [
    `
      .hs-widget-idw .form-label {
        font-size: 0.8125rem;
        font-weight: 500;
      }

      .hs-widget-idw .form-select-sm,
      .hs-widget-idw .form-control-sm {
        font-size: 0.8125rem;
      }

      .hs-widget-idw hs-colormap-picker {
        display: block;
        width: 100%;
      }

      .hs-widget-idw .row .col-6 {
        padding-left: 0.25rem;
        padding-right: 0.25rem;
      }

      .hs-widget-idw .row .col-6:first-child {
        padding-left: 0.75rem;
      }

      .hs-widget-idw .row .col-6:last-child {
        padding-right: 0.75rem;
      }
    `,
  ],

  imports: [FormsModule, ColormapPickerComponent, TranslatePipe, AsyncPipe],
})
/**
 * A widget to configure IDW interpolated layer attribute being
 * interpolated, color scheme used and range of values supported.
 */
export class HsIdwWidgetComponent
  extends HsLayerEditorWidgetBaseComponent
  implements OnInit
{
  hsLanguageService = inject(HsLanguageService);
  hsConfig = inject(HsConfig);

  weightAttribute: string;
  attributes: string[];
  name = 'idw-widget';
  colorMaps = Object.keys(colorScales);
  colorMap: string;
  reversed: boolean;
  min: number | string = '';
  max: number | string = '';

  ngOnInit(): void {
    super.ngOnInit();
    if (!instOf(this.olLayer.getSource(), InterpolatedSource)) {
      return;
    }
    this.fillAttributes();
    this.fillColorMapValue();
  }

  /**
   * Sets colorMap variable value if predefined colorMap is used
   */
  fillColorMapValue() {
    const srcAsIDW = this.getIdwSource();
    const colorMap = srcAsIDW.options.colorMap;
    if (typeof colorMap === 'string') {
      this.reversed = colorMap.includes('-reverse');
      this.colorMap = this.reversed ? colorMap.split('-')[0] : colorMap;
    }
  }

  /**
   * Get possible attributes from first feature which might be used for interpolation.
   * If no features exist, wait for them.
   */
  fillAttributes() {
    const srcAsIDW = this.getIdwSource();
    const underSource = srcAsIDW.featureCache as VectorSource;
    const features = underSource.getFeatures();
    this.attributes = this.listNumericAttributes(features);
    if (this.attributes.length == 0) {
      underSource.once('change', () => this.fillAttributes());
    }
    this.weightAttribute = srcAsIDW.weight;
  }

  listNumericAttributes(features: Feature[]): string[] {
    return listNumericAttributes(features);
  }

  getIdwSource(): InterpolatedSource {
    const srcAsAny = this.olLayer.getSource() as any;
    const srcAsIDW = srcAsAny as InterpolatedSource;
    return srcAsIDW;
  }

  setWeight(): void {
    const srcAsIDW = this.getIdwSource();
    srcAsIDW.weight = this.weightAttribute;
  }

  setBounds(): void {
    const srcAsIDW = this.getIdwSource();
    srcAsIDW.min = this.min == '' ? undefined : parseFloat(this.min.toString());
    srcAsIDW.max = this.max == '' ? undefined : parseFloat(this.max.toString());
  }

  setColorMap(): void {
    const srcAsIDW = this.getIdwSource();
    srcAsIDW.colorMap = this.reversed
      ? `${this.colorMap}-reverse`
      : this.colorMap;
  }
}
