import {Component, Input} from '@angular/core';

import {HsAddDataCatalogueMapService} from 'hslayers-ng/components/add-data';
@Component({
  selector: 'hs-widgets-recursive-dd',
  templateUrl: './recursive-dd.component.html',
})
export class HsUiExtensionsRecursiveDdComponent {
  @Input() value: any;
  entries;

  constructor(public hsDSMapService: HsAddDataCatalogueMapService) {}
  isIterable(): boolean {
    if (this.value && typeof this.value === 'object') {
      this.entries = Object.entries(this.value);
      return true;
    }
    return false;
  }
}
