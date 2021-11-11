import {Component, Input} from '@angular/core';

import {HsAddDataCommonFileService} from '../common-file.service';
import {HsAddDataCommonService} from '../common.service';
import {HsFileShpService} from '../../file/shp/shp.service';
import {HsLanguageService} from './../../../../components/language/language.service';
import {HsUploadedFiles} from './../../../../common/upload/upload.component';

@Component({
  selector: 'hs-new-layer-form',
  templateUrl: 'new-layer-form.component.html',
})
export class HsNewLayerFormComponent {
  advancedPanelVisible = false;
  @Input() data: any;
  constructor(
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    public hsLanguageService: HsLanguageService,
    public hsFileShpService: HsFileShpService
  ) {}

  sldTitle(): string {
    return this.data.sld
      ? this.data.sld.name
      : this.hsLanguageService.getTranslationIgnoreNonExisting(
          'ADDLAYERS.Vector',
          'addSld'
        );
  }

  async read(evt: HsUploadedFiles): Promise<void> {
    await this.hsFileShpService.read(evt);
  }
}
