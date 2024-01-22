import {AfterViewInit, Component, OnInit} from '@angular/core';

import {AddDataFileType} from 'hslayers-ng/types';
import {DEFAULT_SHP_LOAD_TYPE} from '../../enums/load-types.const';
import {HsAddDataCommonFileService} from 'hslayers-ng/shared/add-data';
import {HsAddDataCommonService} from 'hslayers-ng/shared/add-data';
import {HsAddDataFileBaseComponent} from '../file-base.component';
import {HsConfig} from 'hslayers-ng/config';
import {HsFileService} from '../file.service';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsUploadedFiles} from 'hslayers-ng/common/upload';

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
    public hsLayoutService: HsLayoutService,
    public hsConfig: HsConfig,
  ) {
    super(
      hsAddDataCommonService,
      hsAddDataCommonFileService,
      hsLayoutService,
      hsConfig,
    );
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

  async handleFileUpload(evt: HsUploadedFiles): Promise<void> {
    await this.hsFileService.read(evt);
  }
}
