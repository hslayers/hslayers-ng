import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddLayersWfsComponent} from './add-layers-wfs.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule],
  exports: [],
  declarations: [/*HsAddLayersWfsComponent*/],
  providers: [],
})
export class HsAddLayersWfsModule {}
