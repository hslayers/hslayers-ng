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

  /**
   * Act on feature attribute changes
   */
  change(): void {
    if (this.feature?.feature) {
      const feature = this.feature.feature;
      if (this.isObject) {
        feature.set(this.attribute.name, JSON.parse(this.tmpObjectValue));
      } else {
        feature.set(this.attribute.name, this.attribute.value);
      }
    }
  }

  /**
   * Check if attribute value is object and stringify it if needed
   */
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
