import {CommonModule} from '@angular/common';
import {HsConfirmDialogComponent} from './confirm-dialog.component';
import {NgModule} from '@angular/core';
import {TranslateModule, TranslateStore} from '@ngx-translate/core';

@NgModule({
  declarations: [HsConfirmDialogComponent],
  imports: [CommonModule, TranslateModule],
  entryComponents: [HsConfirmDialogComponent],
  providers: [TranslateStore],
  exports: [HsConfirmDialogComponent],
})
export class HsConfirmModule {}
