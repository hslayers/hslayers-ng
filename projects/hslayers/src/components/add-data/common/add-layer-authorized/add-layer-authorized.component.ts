import {Component, Input} from '@angular/core';

import {FileDataObject} from '../../file/types/file-data-object.type';
import {HsAddDataCommonFileService} from '../common-file.service';
import {HsAddDataVectorService} from '../../vector/vector.service';
import {HsConfig} from '../../../../config.service';
import {HsLaymanService} from '../../../save-map/layman.service';

@Component({
  selector: 'hs-add-layer-authorized',
  templateUrl: 'add-layer-authorized.component.html',
})
export class HsAddLayerAuthorizedComponent {
  @Input() data: FileDataObject;

  constructor(
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    private hsAddDataVectorService: HsAddDataVectorService,
    public hsLaymanService: HsLaymanService,
    private hsConfig: HsConfig
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
