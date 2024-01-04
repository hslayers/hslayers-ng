import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import {HsPanelHelpersModule} from 'hslayers-ng/components/layout/panels/panel-helpers.module';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';

import {HsPanelHeaderComponent} from 'hslayers-ng/components/layout/panels/panel-header/panel-header.component';
import {SomeComponent} from './some-panel.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateCustomPipe,
    HsPanelHelpersModule,
    NgbModule,
    HsPanelHeaderComponent,
  ],
  exports: [],
  declarations: [SomeComponent],
  providers: [],
})
export class SomeModule {}
