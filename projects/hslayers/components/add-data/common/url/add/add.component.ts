import {Component, Input} from '@angular/core';

import {HsAddDataUrlService} from 'hslayers-ng/shared/add-data';
import {
  HsUrlTypeServiceModel,
  Service,
} from 'hslayers-ng/types';

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
      this.services?.length > 0 ? this.services : this.layers,
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

  async add(): Promise<void> {
    if (this.layers) {
      const layers = await this.injectedService.getLayers(true);
      this.injectedService.addLayers(layers);
    }
    if (this.injectedService.addServices && this.services) {
      this.injectedService.addServices(this.services);
    }
    //NOTE: THIS CAN BE DONE IF WE CHOSE TO RESET DEFAULT SOMEWHERE ELSE OTHER THAN
    // injectedService.getLayers. add-data/url/<type>/<type>.component.ts constructor maybe?
    // zoomToLayers implemented for wms, wfs
    // if (this.injectedService.zoomToLayers) {
    //   this.injectedService.zoomToLayers();
    // }
  }

  changed(): void {
    this.hsAddDataUrlService.searchForChecked([
      ...(this.layers ?? []),
      ...(this.services ?? []),
    ]);
  }
}
