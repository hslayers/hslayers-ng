import {AsyncPipe, NgClass} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {HsPanelHeaderComponent} from 'hslayers-ng/common/panels';
import {HsPrintComponent} from './print.component';
import {HsPrintImprintStylerComponent} from './imprint-styler/imprint-styler.component';
import {HsPrintLegendStylerComponent} from './legend-styler/legend-styler.component';
import {HsPrintScaleStylerComponent} from './scale-styler/scale-styler.component';
import {HsPrintTextStylerComponent} from './text-styler/text-styler.component';

@NgModule({
  imports: [
    HsPrintImprintStylerComponent,
    HsPrintLegendStylerComponent,
    HsPrintTextStylerComponent,
    HsPrintScaleStylerComponent,
    NgClass,
    AsyncPipe,
    FormsModule,
    TranslatePipe,
    HsPanelHeaderComponent,
  ],
  declarations: [HsPrintComponent],
  exports: [HsPrintComponent],
})
export class PrintModule {}
