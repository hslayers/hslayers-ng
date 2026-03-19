import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {
  HsAddDataCommonService,
  HsAddDataOwsService,
  HsUrlArcGisService,
} from 'hslayers-ng/services/add-data';
import {HsCommonUrlComponent} from '../../common/url/url.component';
import {HsUrlProgressComponent} from '../../common/url/progress/progress.component';
import {HsUrlDetailsComponent} from '../../common/url/details/details.component';

@Component({
  selector: 'hs-url-arcgis',
  templateUrl: './arcgis.component.html',
  imports: [
    FormsModule,
    HsCommonUrlComponent,
    HsUrlProgressComponent,
    HsUrlDetailsComponent,
  ],
})
export class HsUrlArcGisComponent {
  hsAddDataCommonService = inject(HsAddDataCommonService);
  hsUrlArcGisService = inject(HsUrlArcGisService);
  hsAddDataOwsService = inject(HsAddDataOwsService);
}
