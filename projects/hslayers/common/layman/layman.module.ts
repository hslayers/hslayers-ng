import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {FilterPipe} from 'hslayers-ng/common/pipes';
import {HsCommonLaymanAccessRightsComponent} from './access-rights/layman-access-rights.component';
import {HsLaymanCurrentUserComponent} from './layman-current-user.component';
import {HsLaymanLoginComponent} from './layman-login.component';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsLaymanLoginComponent,
    HsLaymanCurrentUserComponent,
    HsCommonLaymanAccessRightsComponent,
  ],
  imports: [
    CommonModule,
    TranslateCustomPipe,
    FilterPipe,
    FormsModule,
    NgbDropdownModule,
  ],
  exports: [
    HsLaymanLoginComponent,
    HsLaymanCurrentUserComponent,
    HsCommonLaymanAccessRightsComponent,
  ],
})
export class HsLaymanModule {}
