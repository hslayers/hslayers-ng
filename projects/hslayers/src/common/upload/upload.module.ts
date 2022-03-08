import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {HsFileDropDirective} from './file-drop.directive';
import {HsLanguageModule} from '../../components/language/language.module';
import {HsUploadComponent} from './upload.component';
@NgModule({
  declarations: [HsUploadComponent, HsFileDropDirective],
  imports: [CommonModule, HsLanguageModule, FormsModule],
  providers: [],
  exports: [HsUploadComponent, HsFileDropDirective],
})
export class HsUploadModule {}
