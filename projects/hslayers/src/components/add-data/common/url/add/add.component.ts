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
  @Input() app = 'default';
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
      const layers = this.injectedService.getLayers(this.app, true);
      this.injectedService.addLayers(layers, this.app);
    }
    if (this.injectedService.addServices && this.services) {
      this.injectedService.addServices(this.services, this.app);
    }
    //NOTE: THIS CAN BE DONE IF WE CHOSE TO RESET DEFAULT SOMEWHERE ELSE OTHER THAN
    // injectedService.getLayers. add-data/url/<type>/<type>.component.ts constructor maybe?
    // zoomToLayers implemented for wms, wfs
    // if (this.injectedService.zoomToLayers) {
    //   this.injectedService.zoomToLayers(this.app);
    // }
  }

  changed(): void {
    this.hsAddDataUrlService.searchForChecked(
      [...(this.layers ?? []), ...(this.services ?? [])],
      this.app
    );
  }
}
