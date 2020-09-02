import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsInfoComponent} from './info.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsInfoComponent],
  imports: [FormsModule, CommonModule, HsPanelHelpersModule],
  exports: [HsInfoComponent],
  providers: [],
  entryComponents: [HsInfoComponent],
})
export class HsInfoModule {}
