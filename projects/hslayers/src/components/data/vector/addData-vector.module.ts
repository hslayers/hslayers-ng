import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCommonModule} from '../common/addData-common.module';
import {HsAddDataVectorComponent} from './addData-vector.component';
import {HsAddDataVectorFileUploadDirective} from './addData-vector.file-upload.directive';
import {HsAddDataVectorService} from './addData-vector.service';
import {HsVectorUrlParserService} from './addData-vector-url-parser.service';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule, HsAddDataCommonModule],
  exports: [HsAddDataVectorComponent],
  declarations: [HsAddDataVectorComponent, HsAddDataVectorFileUploadDirective],
  providers: [HsAddDataVectorService, HsVectorUrlParserService],
})
export class HsAddDataVectorModule {}
