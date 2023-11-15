import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {TranslateCustomPipe} from '../language/translate-custom.pipe';
import {HsMeasureComponent} from './measure.component';
import {HsMeasureToolbarComponent} from './measure-toolbar.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsMeasureComponent, HsMeasureToolbarComponent],
  imports: [
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    NgbDropdownModule,
    TranslateCustomPipe,
  ],
  exports: [HsMeasureComponent, HsMeasureToolbarComponent],
})
export class HsMeasureModule {}
