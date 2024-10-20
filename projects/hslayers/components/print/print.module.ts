import {AsyncPipe, NgClass} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {HsPanelHeaderComponent} from 'hslayers-ng/common/panels';
import {HsPrintComponent} from './print.component';
import {HsPrintImprintStylerComponent} from './imprint-styler/imprint-styler.component';
import {HsPrintLegendStylerComponent} from './legend-styler/legend-styler.component';
import {HsPrintScaleStylerComponent} from './scale-styler/scale-styler.component';
import {HsPrintTextStylerComponent} from './text-styler/text-styler.component';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@NgModule({
  imports: [
    HsPrintImprintStylerComponent,
    HsPrintLegendStylerComponent,
    HsPrintTextStylerComponent,
    HsPrintScaleStylerComponent,
    NgClass,
    AsyncPipe,
    FormsModule,
    TranslateCustomPipe,
    HsPanelHeaderComponent,
  ],
  declarations: [HsPrintComponent],
  exports: [HsPrintComponent],
})
export class PrintModule {}
