import {Component, Input, OnInit} from '@angular/core';

import {AddDataFileType} from '../types/file.type';
import {HsAddDataCommonFileService} from '../../common/common-file.service';
import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataFileBaseComponent} from '../file-base.component';
import {HsConfig} from '../../../../config.service';
import {HsFileService} from '../file.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsUploadedFiles} from '../../../../common/upload/upload.component';

@Component({
  selector: 'hs-file-raster',
  templateUrl: 'raster.component.html',
})
export class HsFileRasterComponent
  extends HsAddDataFileBaseComponent
  implements OnInit
{
  @Input() fileType: Extract<AddDataFileType, 'raster' | 'raster-ts'>;
  constructor(
    public hsFileService: HsFileService,
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    public hsLayoutService: HsLayoutService,
    public hsConfig: HsConfig
  ) {
    super(
      hsAddDataCommonService,
      hsAddDataCommonFileService,
      hsLayoutService,
      hsConfig
    );
  }
  ngOnInit(): void {
    this.baseFileType = this.fileType;
    this.acceptedFormats =
      this.fileType === 'raster-ts'
        ? '.zip'
        : '.tif, .tifw, .tiff, .tiffw, .gtiff, .gtiffw, .tfw, .png, .pngw, .pgw, .png.aux.xml, .jpg, .jpgw, .jgw, .jpg.aux.xml, .jp2, .jp2w, .j2w, .zip, .wld';
    super.ngOnInit();
    this.data.allowedStyles = 'sld';
  }

  async handleFileUpload(evt: HsUploadedFiles): Promise<void> {
    await this.hsFileService.read(evt);
  }
}
