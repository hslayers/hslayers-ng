import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsDataFileComponent} from './data-file.component';
import {HsDataVectorModule} from '../vector/data-vector.module';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsDataFileComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    //
    HsDataVectorModule,
  ],
  exports: [HsDataFileComponent],
  providers: [],
  entryComponents: [HsDataFileComponent],
})
export class HsDataFileModule {}
