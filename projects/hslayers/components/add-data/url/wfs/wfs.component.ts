import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {
  HsAddDataCommonService,
  HsAddDataOwsService,
  HsUrlWfsService,
} from 'hslayers-ng/services/add-data';
import {HsCommonUrlComponent} from '../../common/url/url.component';
import {HsLayerTableComponent} from 'hslayers-ng/common/layer-table';
import {HsUrlAddComponent} from '../../common/url/add/add.component';
import {HsUrlProgressComponent} from '../../common/url/progress/progress.component';

@Component({
  selector: 'hs-url-wfs',
  templateUrl: './wfs.component.html',
  imports: [
    FormsModule,
    HsCommonUrlComponent,
    HsUrlProgressComponent,
    HsLayerTableComponent,
    HsUrlAddComponent,
    TranslatePipe,
  ],
})
export class HsUrlWfsComponent {
  hsUrlWfsService = inject(HsUrlWfsService);
  hsAddDataOwsService = inject(HsAddDataOwsService);
  hsAddDataCommonService = inject(HsAddDataCommonService);

  title = '';
}
