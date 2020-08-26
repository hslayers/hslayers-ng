import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';

import {FormsModule} from '@angular/forms';
import {HsStylerColorComponent} from './styler-color.component';
import {HsStylerComponent} from './styler.component';
import {HsStylerService} from './styler.service';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsStylerComponent, HsStylerColorComponent],
  imports: [CommonModule, HsPanelHelpersModule, FormsModule, NgbModule],
  exports: [HsStylerComponent, HsStylerColorComponent],
  providers: [HsStylerService],
  entryComponents: [HsStylerComponent, HsStylerColorComponent],
})
export class HsStylerModule {}
