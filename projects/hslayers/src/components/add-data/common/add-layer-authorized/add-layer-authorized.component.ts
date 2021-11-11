import {Component, Input} from '@angular/core';

import {HsAddDataCommonFileService} from '../common-file.service';
import {HsLaymanService} from '../../../save-map/layman.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {fileDataObject} from '../../file/types/file-data-object.type';

@Component({
  selector: 'hs-add-layer-authorized',
  templateUrl: 'add-layer-authorized.component.html',
})
export class HsAddLayerAuthorizedComponent {
  @Input() data: fileDataObject;
  constructor(
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    public hsUtilsService: HsUtilsService,
    public hsLaymanService: HsLaymanService
  ) {}
}
