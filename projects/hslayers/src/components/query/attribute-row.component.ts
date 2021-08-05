import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'hs-query-attribute-row',
  templateUrl: './partials/attribute-row.html',
})
export class HsQueryAttributeRowComponent implements OnInit {
  @Input() attribute;
  @Input() feature;
  @Input() readonly: boolean;
  @Input() template;

  ngOnInit(): void {
    this.checkAttributeValue();
  }
  change(): void {
    if (this.feature?.feature) {
      const feature = this.feature.feature;
      feature.set(this.attribute.name, this.attribute.value);
    }
  }

  checkAttributeValue(): void {
    if (
      typeof this.attribute.value == 'object' &&
      !Array.isArray(this.attribute.value)
    ) {
      this.attribute.value = JSON.stringify(this.attribute.value);
    }
  }
}
