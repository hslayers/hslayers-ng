import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddLayersVectorComponent} from './add-layers-vector.component';
import {HsAddLayersVectorService} from './add-layers-vector.service';
import {HsVectorUrlParserService} from './add-layers-vector-url-parser.service';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule],
  exports: [HsAddLayersVectorComponent],
  declarations: [HsAddLayersVectorComponent],
  providers: [HsAddLayersVectorService, HsVectorUrlParserService],
})
export class HsAddLayersVectorModule {}
