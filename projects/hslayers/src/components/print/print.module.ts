import {AsyncPipe, NgClass, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {HsPanelHeaderComponent} from '../layout/panels/panel-header/panel-header.component';
import {HsPrintComponent} from './print.component';
import {HsPrintImprintStylerComponent} from './imprint-styler/imprint-styler.component';
import {HsPrintLegendStylerComponent} from './legend-styler/legend-styler.component';
import {HsPrintScaleStylerComponent} from './scale-styler/scale-styler.component';
import {HsPrintTextStylerComponent} from './text-styler/text-styler.component';
import {TranslateCustomPipe} from '../language/translate-custom.pipe';

@NgModule({
  imports: [
    HsPrintImprintStylerComponent,
    HsPrintLegendStylerComponent,
    HsPrintTextStylerComponent,
    HsPrintScaleStylerComponent,
    NgIf,
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
