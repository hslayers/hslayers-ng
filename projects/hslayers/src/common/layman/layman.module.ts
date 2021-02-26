import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsCommonLaymanService} from './layman.service';
import {HsLaymanCurrentUserComponent} from './layman-current-user.component';
import {HsLaymanLoginComponent} from './layman-login.component';
import {TranslateModule} from '@ngx-translate/core';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsLaymanLoginComponent, HsLaymanCurrentUserComponent],
  imports: [CommonModule, TranslateModule],
  exports: [HsLaymanLoginComponent, HsLaymanCurrentUserComponent],
  providers: [HsCommonLaymanService],
})
export class HsLaymanModule {}
