import {Component, Input} from '@angular/core';

@Component({
  selector: 'hs-query-attribute-row',
  templateUrl: './partials/attribute-row.html',
})
export class HsQueryAttributeRowComponent {
  @Input() attribute;
  @Input() feature;
  @Input() readonly: boolean;
  @Input() template;

  change() {
    if (this.feature?.feature) {
      const feature = this.feature.feature;
      feature.set(this.attribute.name, this.attribute.value);
    }
  }
}
