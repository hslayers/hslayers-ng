import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsMeasureComponent} from './measure.component';
import {HsMeasureToolbarComponent} from './measure-toolbar.component';
import {
  HsPanelHeaderComponent,
  HsPanelHelpersModule,
} from 'hslayers-ng/common/panels';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsMeasureComponent],
  imports: [
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    NgbDropdownModule,
    TranslateCustomPipe,
    HsPanelHeaderComponent,
    HsMeasureToolbarComponent,
  ],
  exports: [HsMeasureComponent, HsMeasureToolbarComponent],
})
export class HsMeasureModule {}
