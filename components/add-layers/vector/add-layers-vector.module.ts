import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddLayersCommonModule} from '../common/add-layers-common.module';
import {HsAddLayersVectorComponent} from './add-layers-vector.component';
import {HsAddLayersVectorFileUploadDirective} from './add-layers-vector.file-upload.directive';
import {HsAddLayersVectorService} from './add-layers-vector.service';
import {HsVectorUrlParserService} from './add-layers-vector-url-parser.service';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HsAddLayersCommonModule,
  ],
  exports: [HsAddLayersVectorComponent],
  declarations: [
    HsAddLayersVectorComponent,
    HsAddLayersVectorFileUploadDirective,
  ],
  providers: [HsAddLayersVectorService, HsVectorUrlParserService],
})
export class HsAddLayersVectorModule {}
