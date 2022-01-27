import {CommonModule} from '@angular/common';
import {HsRmMultipleDialogComponent} from './remove-multiple-dialog.component';
import {NgModule} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  declarations: [HsRmMultipleDialogComponent],
  imports: [CommonModule, TranslateModule],
  exports: [HsRmMultipleDialogComponent],
})
export class HsRmMultipleModule {}
