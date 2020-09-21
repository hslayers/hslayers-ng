import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddLayersWmtsComponent} from './add-layers-wmts.component';
import {HsAddLayersWmtsService} from './add-layers-wmts.service';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule],
  exports: [HsAddLayersWmtsComponent],
  declarations: [HsAddLayersWmtsComponent],
  providers: [HsAddLayersWmtsService],
})
export class HsAddLayersWmtsModule {}
