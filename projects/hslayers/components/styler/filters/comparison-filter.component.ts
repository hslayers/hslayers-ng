import {Component, Input} from '@angular/core';
import {Vector as VectorSource} from 'ol/source';

import {HsLayerSelectorService} from 'hslayers-ng/shared/layer-manager';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsStylerPartBaseComponent} from '../style-part-base.component';

@Component({
  selector: 'hs-comparison-filter',
  templateUrl: './comparison-filter.component.html',
})
export class HsComparisonFilterComponent extends HsStylerPartBaseComponent {
  @Input() filter;
  @Input() parent;

  attributes: string[];
  operators = ['==', '*=', '!=', '<', '<=', '>', '>='];

  constructor(
    private hsLayerSelectorService: HsLayerSelectorService,
    private hsLayerUtilsService: HsLayerUtilsService,
  ) {
    super();
    const layer = this.hsLayerSelectorService.currentLayer.layer;
    const src = layer.getSource();
    const features = (src as VectorSource).getFeatures();
    this.attributes = this.hsLayerUtilsService.listNumericAttributes(features);
  }

  remove(): void {
    if (this.parent) {
      this.parent.splice(this.parent.indexOf(this.filter), 1);
    } else {
      this.deleteRuleFilter();
    }
    this.emitChange();
  }
}
