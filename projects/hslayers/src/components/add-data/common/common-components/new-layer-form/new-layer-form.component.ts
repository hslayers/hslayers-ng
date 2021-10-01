import {Component, Input} from '@angular/core';

import {HsAddDataService} from '../../../add-data.service';
import {HsLanguageService} from '../../../../../components/language/language.service';
import {HsUploadedFiles} from '../../../../../common/upload/upload.component';
import { HsAddDataFileShpService } from '../../../file/shp/add-data-file-shp.service';

@Component({
  selector: 'hs-new-layer-form',
  templateUrl: 'new-layer-form.component.html',
})
export class HsNewLayerFormComponent {
  advancedPanelVisible = false;
  @Input() data: any;
  constructor(
    public hsAddDataService: HsAddDataService,
    public hsLanguageService: HsLanguageService,
    public hsAddDataFileShpService: HsAddDataFileShpService,
  ) {}

  isAuthorized(): boolean {
    return this.hsAddDataService.isAuthorized;
  }

  sldTitle(): string {
    return this.data.sld
      ? this.data.sld.name
      : this.hsLanguageService.getTranslationIgnoreNonExisting(
          'ADDLAYERS.Vector',
          'addSld'
        );
  }

  read(evt: HsUploadedFiles): void {
    this.hsAddDataFileShpService.read(evt);
  }
}
