import 'angular-cookies';
import {BrowserModule} from '@angular/platform-browser';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsLayoutModule} from './../layout/layout.module';
import {HsSearchComponent} from './search.component';
import {HsSearchInputComponent} from './search-input.component';
import {HsSearchResultsComponent} from './search-results.component';
import {HsSearchService} from './search.service';
import {HsShareModule} from './../permalink/share.module';
import {HsStylerModule} from './../styles/styles.module';
import {limitToPipe} from './limitTo.pipe';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [
    HsSearchComponent,
    HsSearchResultsComponent,
    HsSearchInputComponent,
    limitToPipe,
  ],
  imports: [
    BrowserModule,
    HsStylerModule,
    HsLayoutModule,
    HsShareModule,
    FormsModule,
    CommonModule,
  ],
  exports: [
    HsSearchComponent,
    HsSearchResultsComponent,
    HsSearchInputComponent,
  ],
  providers: [HsSearchService],
  entryComponents: [
    HsSearchComponent,
    HsSearchResultsComponent,
    HsSearchInputComponent,
  ],
})
export class HsSearchModule {}
