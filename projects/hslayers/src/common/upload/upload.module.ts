import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';

import {HsFileDropDirective} from './file-drop.directive';
import {HsUploadComponent} from './upload.component';
@NgModule({
  declarations: [HsUploadComponent, HsFileDropDirective],
  imports: [CommonModule, TranslateModule, FormsModule],
  providers: [],
  exports: [HsUploadComponent, HsFileDropDirective],
})
export class HsUploadModule {}
