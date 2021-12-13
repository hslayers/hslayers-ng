import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsCommonLaymanAccessRightsComponent} from './access-rights/layman-access-rights.component';
import {HsLaymanCurrentUserComponent} from './layman-current-user.component';
import {HsLaymanLoginComponent} from './layman-login.component';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsLaymanLoginComponent,
    HsLaymanCurrentUserComponent,
    HsCommonLaymanAccessRightsComponent,
  ],
  imports: [CommonModule, TranslateModule],
  exports: [
    HsLaymanLoginComponent,
    HsLaymanCurrentUserComponent,
    HsCommonLaymanAccessRightsComponent,
  ],
})
export class HsLaymanModule {}
