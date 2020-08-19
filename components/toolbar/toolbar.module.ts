import '../core/';
import {BrowserModule} from '@angular/platform-browser';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';

import {FormsModule} from '@angular/forms';
import {HsDrawModule} from '../draw/draw.module';
import {HsSearchModule} from '../search/search.module'
import {HsToolbarComponent} from './toolbar.component';

import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsToolbarComponent],
  imports: [CommonModule, BrowserModule, FormsModule, NgbModule, HsDrawModule, HsSearchModule],
  exports: [HsToolbarComponent],
  providers: [],
  entryComponents: [HsToolbarComponent],
})
export class HsToolbarModule {}
