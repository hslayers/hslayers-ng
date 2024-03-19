import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsStylerService} from 'hslayers-ng/services/styler';

@Component({
  selector: 'hs-add-colormap',
  templateUrl: './add-colormap.component.html',
})
export class HsAddColormapComponent implements OnInit {
  name = 'add-colormap';
  @Input() layer: VectorLayer<VectorSource>;
  weightAttribute: string;
  attributes: string[];
  colorMap: string;
  min: number | string = '';
  max: number | string = '';
  @Output() canceled = new EventEmitter<void>();

  constructor(
    public HsLanguageService: HsLanguageService,
    private hsStylerService: HsStylerService,
    private hsLayerUtilsService: HsLayerUtilsService,
  ) {}

  ngOnInit(): void {
    const src = this.layer.getSource();
    const features = src.getFeatures();
    this.attributes = this.hsLayerUtilsService.listNumericAttributes(features);
  }

  changeAttrib() {
    const values = this.layer
      .getSource()
      .getFeatures()
      .map((f) => parseFloat(f.get(this.weightAttribute)));
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (!isNaN(min)) {
      this.min = min;
    }
    if (!isNaN(max)) {
      this.max = max;
    }
  }

  save(): void {
    this.hsStylerService.addRule('ColorMap', {
      colorMapName: this.colorMap,
      min: this.min ? parseFloat(this.min.toString()) : undefined,
      max: this.max ? parseFloat(this.max.toString()) : undefined,
      attribute: this.weightAttribute,
    });
  }

  cancel(): void {
    this.canceled.emit();
  }
}
