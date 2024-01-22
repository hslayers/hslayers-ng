import {Component, Input, OnInit} from '@angular/core';

import {AddDataFileType} from 'hslayers-ng/types';
import {HsAddDataCommonFileService} from 'hslayers-ng/shared/add-data';
import {HsAddDataCommonService} from 'hslayers-ng/shared/add-data';
import {HsAddDataFileBaseComponent} from '../file-base.component';
import {HsConfig} from 'hslayers-ng/config';
import {HsFileService} from '../file.service';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsUploadedFiles} from 'hslayers-ng/common/upload';

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
    public hsConfig: HsConfig,
  ) {
    super(
      hsAddDataCommonService,
      hsAddDataCommonFileService,
      hsLayoutService,
      hsConfig,
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
