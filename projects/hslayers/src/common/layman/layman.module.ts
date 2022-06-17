import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsCommonLaymanAccessRightsComponent} from './access-rights/layman-access-rights.component';
import {HsLanguageModule} from '../../components/language/language.module';
import {HsLaymanCurrentUserComponent} from './layman-current-user.component';
import {HsLaymanLoginComponent} from './layman-login.component';
import {HsSetPermissionsDialogComponent} from './dialog-set-permissions/set-permissions.component';
import {HsUiExtensionsModule} from '../widgets/ui-extensions.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsLaymanLoginComponent,
    HsLaymanCurrentUserComponent,
    HsCommonLaymanAccessRightsComponent,
    HsSetPermissionsDialogComponent,
  ],
  imports: [CommonModule, HsLanguageModule, HsUiExtensionsModule, FormsModule],
  exports: [
    HsLaymanLoginComponent,
    HsLaymanCurrentUserComponent,
    HsCommonLaymanAccessRightsComponent,
    HsSetPermissionsDialogComponent,
  ],
})
export class HsLaymanModule {}
