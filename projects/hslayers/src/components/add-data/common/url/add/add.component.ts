import {Component, Input} from '@angular/core';

import {HsAddDataUrlService} from '../../../url/add-data-url.service';
import {
  HsUrlTypeServiceModel,
  Service,
} from '../../../url/models/url-type-service.model';

@Component({
  selector: 'hs-url-add',
  templateUrl: './add.component.html',
})
export class HsUrlAddComponent {
  @Input() services?: Service[];
  @Input() layers: {name: string; checked: boolean}[];
  @Input() injectedService: HsUrlTypeServiceModel;
  _selectAll = true;

  constructor(public hsAddDataUrlService: HsAddDataUrlService) {}

  /**
   * Select all records from service.
   */
  selectAll(): void {
    this._selectAll = !this._selectAll;
    this.checkAllRecords(
      this.services?.length > 0 ? this.services : this.layers
    );
  }

  checkAllRecords(records: any[]): void {
    if (!records) {
      return;
    }
    for (const r of records) {
      r.checked = !this._selectAll;
      if (r.Layer) {
        this.checkAllRecords(r.Layer);
      }
    }
    this.changed();
  }

  add(): void {
    if (this.layers) {
      this.injectedService.addLayers(true);
    }
    if (this.injectedService.addServices && this.services) {
      this.injectedService.addServices(this.services);
    }
    //FIXME: to implement
    // this.injectedService.zoomToLayers();
  }

  changed(): void {
    this.hsAddDataUrlService.searchForChecked([
      ...(this.layers ?? []),
      ...(this.services ?? []),
    ]);
  }
}
