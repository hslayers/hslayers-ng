import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddLayersWmsComponent} from './add-layers-wms.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule],
  exports: [],
  declarations: [/*HsAddLayersWmsComponent*/],
  providers: [],
})
export class HsAddLayersWmsModule {}
