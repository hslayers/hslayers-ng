import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsDataArcGisComponent} from './data-url-arcgis.component';
import {HsDataArcGisService} from './data-url-arcgis.service';
import {HsDataCommonModule} from '../../common/data-common.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule, HsDataCommonModule],
  exports: [HsDataArcGisComponent],
  declarations: [HsDataArcGisComponent],
  providers: [HsDataArcGisService],
})
export class HsDataArcGisModule {}
