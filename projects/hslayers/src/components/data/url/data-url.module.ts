import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsDataUrlComponent} from './data-url-component';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsDataUrlComponent],
  imports: [CommonModule, FormsModule, TranslateModule],
  exports: [HsDataUrlComponent],
  providers: [],
  entryComponents: [HsDataUrlComponent],
})
export class HsDataUrlModule {}
