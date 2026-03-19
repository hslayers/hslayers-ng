import {AfterViewInit, Component, OnInit, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {AddDataFileType} from 'hslayers-ng/types';
import {DEFAULT_SHP_LOAD_TYPE} from '../../enums/load-types.const';
import {
  HsAddDataCommonFileService,
  HsAddDataCommonService,
} from 'hslayers-ng/services/add-data';
import {HsAddDataFileBaseComponent} from '../file-base.component';
import {HsAddLayerAuthorizedComponent} from '../../common/add-layer-authorized/add-layer-authorized.component';
import {HsConfig} from 'hslayers-ng/config';
import {HsFileService} from '../file.service';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsNewLayerFormComponent} from '../../common/new-layer-form/new-layer-form.component';
import {HsUploadedFiles, HsUploadComponent} from 'hslayers-ng/common/upload';

@Component({
  selector: 'hs-file-shp',
  templateUrl: './shp.component.html',
  imports: [
    FormsModule,
    HsUploadComponent,
    HsNewLayerFormComponent,
    HsAddLayerAuthorizedComponent,
    TranslatePipe,
  ],
})
export class HsFileShpComponent
  extends HsAddDataFileBaseComponent
  implements OnInit, AfterViewInit
{
  hsFileService = inject(HsFileService);
  hsAddDataCommonService = inject(HsAddDataCommonService);
  hsAddDataCommonFileService = inject(HsAddDataCommonFileService);
  hsLayoutService = inject(HsLayoutService);
  hsConfig = inject(HsConfig);

  fileType: AddDataFileType = 'shp';

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
