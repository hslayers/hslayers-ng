import {Component, Input, OnInit, inject} from '@angular/core';

import {AddDataFileType} from 'hslayers-ng/types';
import {
  HsAddDataCommonFileService,
  HsAddDataCommonService,
} from 'hslayers-ng/services/add-data';
import {HsAddDataFileBaseComponent} from '../file-base.component';
import {HsConfig} from 'hslayers-ng/config';
import {HsFileService} from '../file.service';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsUploadedFiles} from 'hslayers-ng/common/upload';

@Component({
  selector: 'hs-file-raster',
  templateUrl: 'raster.component.html',
  standalone: false,
})
export class HsFileRasterComponent
  extends HsAddDataFileBaseComponent
  implements OnInit
{
  hsFileService = inject(HsFileService);
  hsAddDataCommonService = inject(HsAddDataCommonService);
  hsAddDataCommonFileService = inject(HsAddDataCommonFileService);
  hsLayoutService = inject(HsLayoutService);
  hsConfig = inject(HsConfig);

  @Input() fileType: Extract<AddDataFileType, 'raster' | 'raster-ts'>;

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
