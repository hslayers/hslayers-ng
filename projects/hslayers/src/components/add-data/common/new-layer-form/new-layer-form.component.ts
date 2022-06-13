import {Component, Input, OnInit} from '@angular/core';

import {
  HsAddDataCommonFileService,
  HsAddDataCommonFileServiceParams,
} from '../common-file.service';
import {HsFileService} from '../../file/file.service';
import {HsLanguageService} from './../../../../components/language/language.service';
import {HsLaymanService} from '../../../save-map/layman.service';
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
  srsFilter = (srs: string): boolean => {
    return true;
  };
  constructor(
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    private hsLanguageService: HsLanguageService,
    private hsFileService: HsFileService,
    public hsLaymanService: HsLaymanService
  ) {}

  ngOnInit() {
    this.appRef = this.hsAddDataCommonFileService.get(this.app);
    if (this.data.type === 'raster') {
      this.srsFilter = (item): boolean => {
        return ['4326', '3857'].some((epsg) => item.includes(epsg));
      };
    }
  }

  sldTitle(): string {
    return this.data.sld
      ? this.data.sld.name
      : this.hsLanguageService.getTranslationIgnoreNonExisting(
          'ADDLAYERS.Vector',
          'addSld',
          undefined,
          this.app
        );
  }

  async read(evt: HsUploadedFiles): Promise<void> {
    await this.hsFileService.read(
      evt,
      this.app,
      this.data.dataType === 'geojson'
    );
  }
}
