import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsPanelHelpersModule} from '../layout/public-api';
import {HsToolbarComponent} from './toolbar.component';
import {HsToolbarPanelBaseComponent} from './toolbar-panel-base.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsToolbarComponent, HsToolbarPanelBaseComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgbDropdownModule,
    TranslateModule,
    HsPanelHelpersModule,
  ],
  exports: [HsToolbarComponent, HsToolbarPanelBaseComponent],
})
export class HsToolbarModule {}
