import {CommonModule} from '@angular/common';
import {HsConfirmDialogComponent} from './confirm-dialog.component';
import {NgModule} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  declarations: [HsConfirmDialogComponent],
  imports: [CommonModule, TranslateModule],
  exports: [HsConfirmDialogComponent],
})
export class HsConfirmModule {}
