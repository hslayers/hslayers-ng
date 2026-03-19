import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {
  HsAddDataCommonService,
  HsAddDataOwsService,
  HsUrlWmtsService,
} from 'hslayers-ng/services/add-data';
import {HsCommonUrlComponent} from '../../common/url/url.component';
import {HsLayerTableComponent} from 'hslayers-ng/common/layer-table';
import {HsUrlAddComponent} from '../../common/url/add/add.component';
import {HsUrlProgressComponent} from '../../common/url/progress/progress.component';

@Component({
  selector: 'hs-url-wmts',
  templateUrl: './wmts.component.html',
  imports: [
    FormsModule,
    HsCommonUrlComponent,
    HsUrlProgressComponent,
    HsLayerTableComponent,
    HsUrlAddComponent,
  ],
})
export class HsUrlWmtsComponent {
  hsAddDataOwsService = inject(HsAddDataOwsService);
  hsUrlWmtsService = inject(HsUrlWmtsService);
  hsAddDataCommonService = inject(HsAddDataCommonService);
}
