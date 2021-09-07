import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';

import {FormsModule} from '@angular/forms';
import {HsDrawModule} from '../draw/draw.module';
import {HsSearchModule} from '../search/search.module';
import {HsToolbarComponent} from './toolbar.component';

import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsToolbarComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    HsDrawModule,
    HsSearchModule,
    TranslateModule,
  ],
  exports: [HsToolbarComponent],
  entryComponents: [HsToolbarComponent],
})
export class HsToolbarModule {}
