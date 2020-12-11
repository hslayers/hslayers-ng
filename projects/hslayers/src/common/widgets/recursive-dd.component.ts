import {Component, Input} from '@angular/core';

import {HsDatasourcesMapService} from '../../components/datasource-selector/datasource-selector-map.service';
@Component({
  selector: 'hs-widgets-recursive-dd',
  templateUrl: './recursive-dd.html',
})
export class HsUiExtensionsRecursiveDd {
  @Input() value: any;
  entries;

  constructor(
    public hsDSMapService: HsDatasourcesMapService // used in template
  ) {}
  isIterable(): boolean {
    if (this.value && typeof this.value === 'object') {
      this.entries = Object.entries(this.value);
      return true;
    }
    return false;
  }
}
