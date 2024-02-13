import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsMeasureComponent} from './measure.component';
import {HsMeasureToolbarComponent} from './measure-toolbar.component';
import {HsPanelHeaderComponent} from 'hslayers-ng/common/panels';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsMeasureComponent, HsMeasureToolbarComponent],
  imports: [
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    NgbDropdownModule,
    TranslateCustomPipe,
    HsPanelHeaderComponent,
  ],
  exports: [HsMeasureComponent, HsMeasureToolbarComponent],
})
export class HsMeasureModule {}
