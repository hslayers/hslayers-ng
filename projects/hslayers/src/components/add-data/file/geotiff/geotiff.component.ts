import {Component, OnInit} from '@angular/core';

import {HsAddDataCommonFileService} from '../../common/common-file.service';
import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataFileBaseComponent} from '../file-base.component';
import {HsFileService} from '../file.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsUploadedFiles} from '../../../../common/upload/upload.component';

@Component({
  selector: 'hs-file-geotiff',
  templateUrl: 'geotiff.component.html',
})
export class HsFileGeotiffComponent
  extends HsAddDataFileBaseComponent
  implements OnInit {
  dataType = 'geotiff';
  constructor(
    public hsFileService: HsFileService,
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    public hsLayoutService: HsLayoutService
  ) {
    super(hsAddDataCommonService, hsAddDataCommonFileService, hsLayoutService);
  }
  ngOnInit(): void {
    this.baseDataType = this.dataType;
    this.acceptedFormats = '.tif, .tiff, .gtiff, .zip';
    super.ngOnInit();
  }

  async handleFileUpload(evt: HsUploadedFiles): Promise<void> {
    await this.hsFileService.read(evt);
  }
}
