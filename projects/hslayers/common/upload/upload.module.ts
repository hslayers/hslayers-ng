import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {HsFileDropDirective} from './file-drop.directive';
import {TranslateCustomPipe} from '../../components/language/translate-custom.pipe';
import {HsUploadComponent} from './upload.component';
@NgModule({
  declarations: [HsUploadComponent, HsFileDropDirective],
  imports: [CommonModule, TranslateCustomPipe, FormsModule],
  providers: [],
  exports: [HsUploadComponent, HsFileDropDirective],
})
export class HsUploadModule {}
