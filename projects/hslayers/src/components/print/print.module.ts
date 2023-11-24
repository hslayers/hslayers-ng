import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {ColorSketchModule} from 'ngx-color/sketch';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsPanelHeaderComponent} from '../layout/panels/panel-header/panel-header.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsPrintComponent} from './print.component';
import {HsPrintImprintStylerComponent} from './imprint-styler/imprint-styler.component';
import {HsPrintLegendStylerComponent} from './legend-styler/legend-styler.component';
import {HsPrintScaleStylerComponent} from './scale-styler/scale-styler.component';
import {HsPrintTextStylerComponent} from './text-styler/text-styler.component';
import {TranslateCustomPipe} from '../language/translate-custom.pipe';

/**
 * Add print dialog template to the app
 */
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsPrintComponent,
    HsPrintTextStylerComponent,
    HsPrintScaleStylerComponent,
    HsPrintLegendStylerComponent,
    HsPrintImprintStylerComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    TranslateCustomPipe,
    ColorSketchModule,
    NgbDropdownModule,
    HsPanelHeaderComponent,
  ],
  exports: [
    HsPrintComponent,
    HsPrintTextStylerComponent,
    HsPrintScaleStylerComponent,
    HsPrintLegendStylerComponent,
    HsPrintImprintStylerComponent,
  ],
})
export class HsPrintModule {}
