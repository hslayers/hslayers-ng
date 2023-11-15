import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {TranslateCustomPipe} from '../language/translate-custom.pipe';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsSearchComponent} from './search.component';
import {HsSearchInputComponent} from './search-input.component';
import {HsSearchResultsComponent} from './search-results.component';
import {HsSearchToolbarComponent} from './search-toolbar.component';
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
  imports: [FormsModule, CommonModule, HsPanelHelpersModule, TranslateCustomPipe],
  exports: [
    HsSearchComponent,
    HsSearchResultsComponent,
    HsSearchInputComponent,
    HsSearchToolbarComponent,
  ],
})
export class HsSearchModule {}
