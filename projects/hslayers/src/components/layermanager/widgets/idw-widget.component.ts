import {Component, OnInit} from '@angular/core';

import colorScales from 'colormap/colorScale';
import {Feature} from 'ol';
import {Vector as VectorSource} from 'ol/source';

import {HsLanguageService} from '../../language/language.service';
import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';
import {HsLayerSelectorService} from '../editor/layer-selector.service';
import {HsUtilsService} from '../../utils/utils.service';
import {InterpolatedSource} from '../../../common/layers/hs.source.interpolated';

export function listNumericAttributes(features: Feature[]): string[] {
  return features.length > 0
    ? Object.keys(features[0].getProperties()).filter(
        (attr) => {
          return (
            attr != 'geometry' &&
            attr != 'hs_normalized_IDW_value' &&
            !isNaN(Number(features[0].get(attr)))
          );
        } //Check if number
      )
    : [];
}

@Component({
  selector: 'hs-idw-widget',
  templateUrl: './idw-widget.component.html',
})
/**
 * A widget to configure IDW interpolated layer attribute being
 * interpolated, color scheme used and range of values supported.
 */
export class HsIdwWidgetComponent
  extends HsLayerEditorWidgetBaseComponent
  implements OnInit {
  weightAttribute: string;
  attributes: string[];
  name = 'idw-widget';
  colorMaps = Object.keys(colorScales);
  colorMap: string;
  reversed: boolean;
  min: number | string = '';
  max: number | string = '';

  constructor(
    public HsLanguageService: HsLanguageService,
    hsLayerSelectorService: HsLayerSelectorService,
    private hsUtilsService: HsUtilsService
  ) {
    super(hsLayerSelectorService);
  }

  ngOnInit(): void {
    super.ngOnInit();
    if (
      !this.hsUtilsService.instOf(this.olLayer.getSource(), InterpolatedSource)
    ) {
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
