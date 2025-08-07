import {Component, Input, inject} from '@angular/core';

import {FileDataObject} from 'hslayers-ng/types';
import {HsAddDataCommonFileService} from 'hslayers-ng/services/add-data';
import {HsLaymanService} from 'hslayers-ng/services/save-map';

@Component({
  selector: 'hs-add-layer-authorized',
  templateUrl: 'add-layer-authorized.component.html',
  standalone: false,
})
export class HsAddLayerAuthorizedComponent {
  hsAddDataCommonFileService = inject(HsAddDataCommonFileService);
  hsLaymanService = inject(HsLaymanService);

  @Input() data: FileDataObject;

  async add(): Promise<void> {
    await this.hsAddDataCommonFileService.addAsService(this.data);
  }

  private hasNameAndSrs() {
    return this.data.name && this.data.srs;
  }

  canAdd() {
    return this.data.type == 'raster-ts'
      ? this.hasNameAndSrs() && this.data.timeRegex
      : this.hasNameAndSrs();
  }
}
