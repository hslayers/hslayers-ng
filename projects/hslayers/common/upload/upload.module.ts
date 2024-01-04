import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {HsFileDropDirective} from './file-drop.directive';
import {HsUploadComponent} from './upload.component';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';
@NgModule({
  declarations: [HsUploadComponent, HsFileDropDirective],
  imports: [CommonModule, TranslateCustomPipe, FormsModule],
  providers: [],
  exports: [HsUploadComponent, HsFileDropDirective],
})
export class HsUploadModule {}
