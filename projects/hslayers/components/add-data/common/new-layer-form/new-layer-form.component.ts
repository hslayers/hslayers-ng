import {Component, Input, OnInit} from '@angular/core';

import {FileDataObject} from '../../file/types/file-data-object.type';
import {HsAddDataCommonFileService} from '../common-file.service';
import {HsFileService} from '../../file/file.service';
import {HsLaymanService} from 'hslayers-ng/shared/save-map';
import {HsUploadedFiles} from 'hslayers-ng/common/upload';

@Component({
  selector: 'hs-new-layer-form',
  templateUrl: 'new-layer-form.component.html',
})
export class HsNewLayerFormComponent implements OnInit {
  advancedPanelVisible = false;
  @Input() data: FileDataObject;

  allowedStyles: {
    list: string;
    title: string;
  };
  constructor(
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    private hsFileService: HsFileService,
    public hsLaymanService: HsLaymanService,
  ) {}

  ngOnInit() {
    this.allowedStyles = {
      list:
        this.data.allowedStyles.length > 3
          ? '.sld, .qml'
          : `.${this.data.allowedStyles}`,
      title: `ADDLAYERS.add${this.data.allowedStyles}`,
    };
  }

  async read(evt: HsUploadedFiles): Promise<void> {
    await this.hsFileService.read(evt, this.data.type === 'geojson');
  }
}
