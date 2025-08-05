import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {
  HsPanelHeaderComponent,
  HsPanelHelpersModule,
} from 'hslayers-ng/common/panels';
import {HsSearchComponent} from './search.component';
import {HsSearchInputComponent} from './search-input.component';
import {HsSearchResultsComponent} from './search-results.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsSearchComponent],
  imports: [
    FormsModule,
    CommonModule,
    HsPanelHelpersModule,
    TranslatePipe,
    HsPanelHeaderComponent,
    HsSearchInputComponent,
    HsSearchResultsComponent,
  ],
  exports: [HsSearchComponent],
})
export class HsSearchModule {}
