import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsToolbarComponent} from './toolbar.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsToolbarComponent],
  imports: [CommonModule, FormsModule, NgbDropdownModule, HsPanelHelpersModule],
  exports: [HsToolbarComponent],
})
export class HsToolbarModule {}
