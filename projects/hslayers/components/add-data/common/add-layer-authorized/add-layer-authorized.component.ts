import {Component, Input, inject} from '@angular/core';
import {NgbProgressbar} from '@ng-bootstrap/ng-bootstrap';
import {TranslatePipe} from '@ngx-translate/core';

import {FileDataObject} from 'hslayers-ng/types';
import {HsAddDataCommonFileService} from 'hslayers-ng/services/add-data';
import {HsAddToMapButtonComponent} from 'hslayers-ng/common/add-to-map';
import {HsLaymanCurrentUserComponent} from 'hslayers-ng/common/layman';
import {HsLaymanService} from 'hslayers-ng/services/save-map';

@Component({
  selector: 'hs-add-layer-authorized',
  templateUrl: 'add-layer-authorized.component.html',
  imports: [
    HsAddToMapButtonComponent,
    NgbProgressbar,
    HsLaymanCurrentUserComponent,
    TranslatePipe,
  ],
})
export class HsAddLayerAuthorizedComponent {
  hsAddDataCommonFileService = inject(HsAddDataCommonFileService);
  hsLaymanService = inject(HsLaymanService);

  @Input() data: FileDataObject;

  async add(): Promise<void> {
    await this.hsAddDataCommonFileService.addAsService(this.data);
  }

  private hasNameAndSrs() {
    return this.data.name && this.data.srs;
  }

  canAdd() {
    return this.data.type == 'raster-ts'
      ? this.hasNameAndSrs() && this.data.timeRegex
      : this.hasNameAndSrs();
  }
}
