import {AfterViewInit, Component, Input, OnInit} from '@angular/core';

import {AddDataFileType} from '../types/file.type';
import {DEFAULT_SHP_LOAD_TYPE} from '../../enums/load-types.const';
import {HsAddDataCommonFileService} from '../../common/common-file.service';
import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataFileBaseComponent} from '../file-base.component';
import {HsFileService} from '../file.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsUploadedFiles} from '../../../../common/upload/upload.component';

@Component({
  selector: 'hs-file-shp',
  templateUrl: './shp.component.html',
})
export class HsFileShpComponent
  extends HsAddDataFileBaseComponent
  implements OnInit, AfterViewInit
{
  fileType: AddDataFileType = 'shp';

  constructor(
    public hsFileService: HsFileService,
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    public hsLayoutService: HsLayoutService
  ) {
    super(hsAddDataCommonService, hsAddDataCommonFileService, hsLayoutService);
  }

  ngAfterViewInit(): void {
    this.fileInput = this.hsUploadComponent.getFileInput();
  }

  ngOnInit(): void {
    this.acceptedFormats = '.shp, .shx, .dbf, .sbn, .zip';
    this.baseFileType = this.fileType;
    super.ngOnInit();
    this.data.loadAsType = DEFAULT_SHP_LOAD_TYPE;
  }

  async handleFileUpload(evt: HsUploadedFiles, app: string): Promise<void> {
    await this.hsFileService.read(evt, app);
  }
}
