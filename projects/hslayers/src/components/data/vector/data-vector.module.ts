import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsDataCommonModule} from '../common/data-common.module';
import {HsDataVectorComponent} from './data-vector.component';
import {HsDataVectorFileUploadDirective} from './data-vector.file-upload.directive';
import {HsDataVectorService} from './data-vector.service';
import {HsVectorUrlParserService} from './data-vector-url-parser.service';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule, HsDataCommonModule],
  exports: [HsDataVectorComponent],
  declarations: [HsDataVectorComponent, HsDataVectorFileUploadDirective],
  providers: [HsDataVectorService, HsVectorUrlParserService],
})
export class HsDataVectorModule {}
