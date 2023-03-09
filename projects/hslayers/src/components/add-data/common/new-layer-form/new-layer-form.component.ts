import {Component, Input, OnInit} from '@angular/core';

import {FileDataObject} from '../../file/types/file-data-object.type';
import {
  HsAddDataCommonFileService,
  HsAddDataCommonFileServiceParams,
} from '../common-file.service';
import {HsFileService} from '../../file/file.service';
import {HsLaymanService} from '../../../save-map/layman.service';
import {HsUploadedFiles} from './../../../../common/upload/upload.component';

@Component({
  selector: 'hs-new-layer-form',
  templateUrl: 'new-layer-form.component.html',
})
export class HsNewLayerFormComponent implements OnInit {
  advancedPanelVisible = false;
  @Input() data: FileDataObject;
  @Input() app = 'default';
  appRef: HsAddDataCommonFileServiceParams;
  allowedStyles: {
    list: string;
    title: string;
  };
  constructor(
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    private hsFileService: HsFileService,
    public hsLaymanService: HsLaymanService
  ) {}

  ngOnInit() {
    this.appRef = this.hsAddDataCommonFileService.get(this.app);
    this.allowedStyles = {
      list:
        this.data.allowedStyles.length > 3
          ? '.sld, .qml'
          : `.${this.data.allowedStyles}`,
      title: `ADDLAYERS.add${this.data.allowedStyles}`,
    };
  }

  async read(evt: HsUploadedFiles): Promise<void> {
    await this.hsFileService.read(evt, this.app, this.data.type === 'geojson');
  }
}
