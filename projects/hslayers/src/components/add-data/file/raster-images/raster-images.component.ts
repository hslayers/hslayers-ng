import {Component, OnInit} from '@angular/core';

import {AddDataFileType} from '../types/file.type';
import {HsAddDataCommonFileService} from '../../common/common-file.service';
import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataFileBaseComponent} from '../file-base.component';
import {HsFileService} from '../file.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsUploadedFiles} from '../../../../common/upload/upload.component';

@Component({
  selector: 'hs-raster-images',
  templateUrl: 'raster-images.component.html',
})
export class HsRasterImagesComponent
  extends HsAddDataFileBaseComponent
  implements OnInit {
  dataType: AddDataFileType = 'rasterImages';
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
    this.acceptedFormats =
      '.tif, .tiff, .tfw, .png, .pgw, .png.aux.xml, .jpeg, .jgw, .jpg.aux.xml, .jp2, .j2w, .zip';
    super.ngOnInit();
  }

  async handleFileUpload(evt: HsUploadedFiles): Promise<void> {
    await this.hsFileService.read(evt);
  }
}
