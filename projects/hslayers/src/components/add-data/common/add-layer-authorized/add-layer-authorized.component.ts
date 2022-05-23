import {Component, Input, OnInit} from '@angular/core';

import {FileDataObject} from '../../file/types/file-data-object.type';
import {
  HsAddDataCommonFileService,
  HsAddDataCommonFileServiceParams,
} from '../common-file.service';
import {HsConfig, HsConfigObject} from '../../../../config.service';
import {HsLaymanService} from '../../../save-map/layman.service';

@Component({
  selector: 'hs-add-layer-authorized',
  templateUrl: 'add-layer-authorized.component.html',
})
export class HsAddLayerAuthorizedComponent implements OnInit {
  @Input() data: FileDataObject;
  @Input() app = 'default';
  commonFileServiceRef: HsAddDataCommonFileServiceParams;
  configRef: HsConfigObject;
  constructor(
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    public hsLaymanService: HsLaymanService,
    private hsConfig: HsConfig
  ) {}

  ngOnInit() {
    this.commonFileServiceRef = this.hsAddDataCommonFileService.get(this.app);
    this.configRef = this.hsConfig.get(this.app);
  }

  async addAsWms(): Promise<any> {
    await this.hsAddDataCommonFileService.addAsWms(this.data, this.app);
  }
}
