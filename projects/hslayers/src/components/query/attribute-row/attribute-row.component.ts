import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'hs-query-attribute-row',
  templateUrl: './attribute-row.component.html',
})
export class HsQueryAttributeRowComponent implements OnInit {
  isObject = false;
  @Input() attribute;
  @Input() feature;
  @Input() readonly: boolean;
  @Input() template;
  tmpObjectValue: any;
  ngOnInit(): void {
    this.checkAttributeValue();
  }
  change(): void {
    if (this.feature?.feature) {
      const feature = this.feature.feature;
      feature.set(this.attribute.name, JSON.parse(this.tmpObjectValue));
    }
  }

  checkAttributeValue(): void {
    if (
      typeof this.attribute.value == 'object' &&
      !Array.isArray(this.attribute.value)
    ) {
      this.isObject = true;
      this.tmpObjectValue = JSON.stringify(this.attribute.value);
    }
  }
}
