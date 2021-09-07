import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import {HsDrawModule} from '../draw/draw.module';
import {HsPanelHelpersModule} from '../layout/public-api';
import {HsSearchModule} from '../search/search.module';
import {HsToolbarComponent} from './toolbar.component';
import {HsToolbarPanelBaseComponent} from './toolbar-panel-base.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsToolbarComponent, HsToolbarPanelBaseComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    HsDrawModule,
    HsSearchModule,
    TranslateModule,
    HsPanelHelpersModule,
  ],
  exports: [HsToolbarComponent, HsToolbarPanelBaseComponent],
  entryComponents: [HsToolbarComponent],
})
export class HsToolbarModule {}
