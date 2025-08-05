import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {HsAddDataCommonModule} from '../../common/common.module';
import {HsCommonUrlModule} from '../../common/url/url.module';
import {HsLayerTableComponent} from 'hslayers-ng/common/layer-table';
import {HsUrlXyzComponent} from './xyz.component';
import {HsAddToMapButtonComponent} from 'hslayers-ng/common/add-to-map';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    HsAddDataCommonModule,
    HsCommonUrlModule,
    HsLayerTableComponent,
    HsAddToMapButtonComponent,
  ],
  exports: [HsUrlXyzComponent],
  declarations: [HsUrlXyzComponent],
})
export class HsUrlXyzModule {}
