import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsPanelHeaderComponent} from 'hslayers-ng/common/panels';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsSearchComponent} from './search.component';
import {HsSearchInputComponent} from './search-input.component';
import {HsSearchResultsComponent} from './search-results.component';
import {HsSearchToolbarComponent} from './search-toolbar.component';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';
import {limitToPipe} from './limitTo.pipe';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsSearchComponent,
    HsSearchResultsComponent,
    HsSearchInputComponent,
    limitToPipe,
    HsSearchToolbarComponent,
  ],
  imports: [
    FormsModule,
    CommonModule,
    HsPanelHelpersModule,
    TranslateCustomPipe,
    HsPanelHeaderComponent,
  ],
  exports: [
    HsSearchComponent,
    HsSearchResultsComponent,
    HsSearchInputComponent,
    HsSearchToolbarComponent,
  ],
})
export class HsSearchModule {}
