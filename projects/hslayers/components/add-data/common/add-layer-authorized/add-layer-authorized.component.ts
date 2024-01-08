import {Component, Input} from '@angular/core';

import {FileDataObject} from 'hslayers-ng/common/types';
import {HsAddDataCommonFileService} from 'hslayers-ng/shared/add-data';
import {HsLaymanService} from 'hslayers-ng/shared/save-map';

@Component({
  selector: 'hs-add-layer-authorized',
  templateUrl: 'add-layer-authorized.component.html',
})
export class HsAddLayerAuthorizedComponent {
  @Input() data: FileDataObject;

  constructor(
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    public hsLaymanService: HsLaymanService,
  ) {}

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
