import {Component, Input} from '@angular/core';
import {Vector as VectorSource} from 'ol/source';

import {HsLayerSelectorService} from '../../layermanager/editor/layer-selector.service';
import {HsStylerPartBaseComponent} from '../style-part-base.component';
import {listNumericAttributes} from '../../layermanager/widgets/idw-widget.component';

@Component({
  selector: 'hs-comparison-filter',
  templateUrl: './comparison-filter.component.html',
})
export class HsComparisonFilterComponent extends HsStylerPartBaseComponent {
  @Input() filter;
  @Input() parent;

  attributes: string[];
  operators = ['==', '*=', '!=', '<', '<=', '>', '>='];

  constructor(private hsLayerSelectorService: HsLayerSelectorService) {
    super();
    const layer = this.hsLayerSelectorService.currentLayer.layer;
    const src = layer.getSource();
    const features = (src as VectorSource).getFeatures();
    this.attributes = listNumericAttributes(features);
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
