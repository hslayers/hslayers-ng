import {Component, OnInit} from '@angular/core';

import VectorSource from 'ol/source/Vector';
import colorScales from 'colormap/colorScale';
import colormap from 'colormap';

import {Feature} from 'ol';
import {HsLanguageService} from '../../language/language.service';
import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';
import {HsLayerSelectorService} from '../editor/layer-selector.service';
import {InterpolatedSource} from '../../../common/layers/hs.source.interpolated';

@Component({
  selector: 'hs-idw-widget',
  templateUrl: './idw-widget.component.html',
})
export class HsIdwWidgetComponent
  extends HsLayerEditorWidgetBaseComponent
  implements OnInit
{
  weightAttribute: string;
  attributes: string[];
  name = 'idw-widget';
  colorMaps = Object.keys(colorScales);
  colorMap;
  min: number | string = '';
  max: number | string = '';

  constructor(
    public HsLanguageService: HsLanguageService,
    hsLayerSelectorService: HsLayerSelectorService
  ) {
    super(hsLayerSelectorService);
  }

  ngOnInit(): void {
    super.ngOnInit();
    const srcAsIDW = this.getIdwSource();
    const underSource = srcAsIDW.featureCache as VectorSource;
    const features = underSource.getFeatures();
    this.attributes = this.listNumericAttributes(features);
    this.weightAttribute = srcAsIDW.weight;
  }

  listNumericAttributes(features: Feature[]): string[] {
    return features.length > 0
      ? Object.keys(features[0].getProperties()).filter(
          (attr) => {
            return attr != 'geometry' && !isNaN(Number(features[0].get(attr)));
          } //Check if number
        )
      : [];
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
    const generatedColorMap = this.generateColormap(100);

    srcAsIDW.colorMap = (v) => {
      const black = [0, 0, 0, 255];
      if (isNaN(v)) {
        return black;
      }
      if (v > 99) {
        v = 99;
      }
      if (v < 0) {
        v = 0;
      }
      v = Math.floor(v);
      return generatedColorMap[v];
    };
  }

  generateColormap(nshades: number) {
    return colormap({
      colormap: this.colorMap,
      nshades,
      format: 'rgb',
      alpha: 255,
    }).map((v) => {
      v[3] = 255;
      return v;
    });
  }
}
