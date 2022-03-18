import {Component, Input, OnInit} from '@angular/core';

import {
  HsAddDataCommonFileService,
  HsAddDataCommonFileServiceParams,
} from '../common-file.service';
import {HsLaymanService} from '../../../save-map/layman.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {fileDataObject} from '../../file/types/file-data-object.type';

@Component({
  selector: 'hs-add-layer-authorized',
  templateUrl: 'add-layer-authorized.component.html',
})
export class HsAddLayerAuthorizedComponent implements OnInit {
  @Input() data: fileDataObject;
  @Input() app = 'default';
  appRef: HsAddDataCommonFileServiceParams;

  constructor(
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    public hsUtilsService: HsUtilsService,
    public hsLaymanService: HsLaymanService
  ) {}

  ngOnInit() {
    this.appRef = this.hsAddDataCommonFileService.get(this.app);
  }
}
