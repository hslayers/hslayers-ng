import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddLayersArcGisComponent} from './add-layers-arcgis.component';
import {HsAddLayersArcGisService} from './add-layers-arcgis.service';
import {HsAddLayersCommonModule} from '../common/add-layers-common.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HsAddLayersCommonModule,
  ],
  exports: [HsAddLayersArcGisComponent],
  declarations: [HsAddLayersArcGisComponent],
  providers: [HsAddLayersArcGisService],
})
export class HsAddLayersArcGisModule {}
