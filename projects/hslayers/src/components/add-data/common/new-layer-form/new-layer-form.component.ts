import {Component, Input, OnInit} from '@angular/core';

import {
  HsAddDataCommonFileService,
  HsAddDataCommonFileServiceParams,
} from '../common-file.service';
import {HsAddDataCommonService} from '../common.service';
import {HsFileService} from '../../file/file.service';
import {HsLanguageService} from './../../../../components/language/language.service';
import {HsUploadedFiles} from './../../../../common/upload/upload.component';

@Component({
  selector: 'hs-new-layer-form',
  templateUrl: 'new-layer-form.component.html',
})
export class HsNewLayerFormComponent implements OnInit {
  advancedPanelVisible = false;
  @Input() data: any;
  @Input() app = 'default';
  appRef: HsAddDataCommonFileServiceParams;

  constructor(
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    public hsLanguageService: HsLanguageService,
    public hsFileService: HsFileService
  ) {}

  ngOnInit() {
    this.appRef = this.hsAddDataCommonFileService.get(this.app);
  }

  sldTitle(): string {
    return this.data.sld
      ? this.data.sld.name
      : this.hsLanguageService.getTranslationIgnoreNonExisting(
          'ADDLAYERS.Vector',
          'addSld'
        );
  }

  async read(evt: HsUploadedFiles): Promise<void> {
    await this.hsFileService.read(evt, this.app);
  }
}
