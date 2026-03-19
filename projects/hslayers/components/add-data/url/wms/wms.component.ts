import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {
  HsAddDataCommonService,
  HsAddDataOwsService,
  HsUrlWmsService,
} from 'hslayers-ng/services/add-data';
import {HsCommonUrlComponent} from '../../common/url/url.component';
import {HsUrlDetailsComponent} from '../../common/url/details/details.component';
import {HsUrlProgressComponent} from '../../common/url/progress/progress.component';

@Component({
  selector: 'hs-url-wms',
  templateUrl: './wms.component.html',
  imports: [
    FormsModule,
    HsCommonUrlComponent,
    HsUrlProgressComponent,
    HsUrlDetailsComponent,
  ],
})
export class HsUrlWmsComponent {
  hsAddDataCommonService = inject(HsAddDataCommonService);
  hsAddDataOwsService = inject(HsAddDataOwsService);
  hsUrlWmsService = inject(HsUrlWmsService);
}
