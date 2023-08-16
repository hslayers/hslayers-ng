import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsToolbarComponent} from './toolbar.component';
import {HsToolbarPanelBaseComponent} from './toolbar-panel-base.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsToolbarComponent, HsToolbarPanelBaseComponent],
  imports: [CommonModule, FormsModule, NgbDropdownModule, HsPanelHelpersModule],
  exports: [HsToolbarComponent, HsToolbarPanelBaseComponent],
})
export class HsToolbarModule {}
