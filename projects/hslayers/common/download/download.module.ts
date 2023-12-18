import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {HsDownloadDirective} from './download.directive';
@NgModule({
  declarations: [HsDownloadDirective],
  imports: [CommonModule],
  providers: [],
  exports: [HsDownloadDirective],
})
export class HsDownloadModule {}
