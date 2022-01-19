import {Component, Input} from '@angular/core';

import {HsAddDataUrlService} from '../../../url/add-data-url.service';
import {HsUrlTypeServiceModel} from '../../../url/models/url-type-service.model';

@Component({
  selector: 'hs-url-add',
  templateUrl: './add.component.html',
})
export class HsUrlAddComponent {
  @Input() records: any;
  @Input() injectedService: HsUrlTypeServiceModel;
  _selectAll = true;

  constructor(public hsAddDataUrlService: HsAddDataUrlService) {}

  /**
   * Select all records from service.
   */
  selectAll(): void {
    this._selectAll = !this._selectAll;
    this.checkAllRecords(this.records);
  }

  checkAllRecords(records: any[]): void {
    if (!records) {
      return;
    }
    for (const r of records) {
      r.checked = false;
      r.checked = !this._selectAll;
      if (r.Layer) {
        this.checkAllRecords(r.Layer);
      }
    }
    this.changed();
  }

  addLayers(checked: boolean): void {
    this.injectedService.addLayers(checked);
    //FIXME: to implement
    // this.injectedService.zoomToLayers();
  }

  changed(): void {
    this.hsAddDataUrlService.searchForChecked(this.records);
  }
}
