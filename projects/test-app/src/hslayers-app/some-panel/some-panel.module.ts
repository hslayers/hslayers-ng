import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';

import {HsPanelHelpersModule} from 'hslayers-ng/src/components/layout/panels/panel-helpers.module';

import {SomeComponent} from './some-panel.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    NgbModule,
    TranslateModule,
  ],
  exports: [],
  declarations: [SomeComponent],
  providers: [],
})
export class SomeModule {}
