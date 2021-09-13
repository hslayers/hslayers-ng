import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';

import {HsPagerComponent} from './pager.component';

@NgModule({
  declarations: [HsPagerComponent],
  imports: [CommonModule, TranslateModule, FormsModule],
  exports: [HsPagerComponent],
})
export class HsPagerModule {}
