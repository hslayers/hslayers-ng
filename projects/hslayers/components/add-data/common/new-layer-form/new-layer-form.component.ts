import {Component, Input, OnInit, inject} from '@angular/core';

import {FileDataObject} from 'hslayers-ng/types';
import {HsAddDataCommonFileService} from 'hslayers-ng/services/add-data';
import {HsFileService} from '../../file/file.service';
import {HsLaymanService} from 'hslayers-ng/services/save-map';
import {HsUploadedFiles} from 'hslayers-ng/common/upload';

@Component({
  selector: 'hs-new-layer-form',
  templateUrl: 'new-layer-form.component.html',
  standalone: false,
})
export class HsNewLayerFormComponent implements OnInit {
  hsAddDataCommonFileService = inject(HsAddDataCommonFileService);
  private hsFileService = inject(HsFileService);
  hsLaymanService = inject(HsLaymanService);

  advancedPanelVisible = false;
  @Input() data: FileDataObject;

  allowedStyles: {
    list: string;
    title: string;
  };

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
