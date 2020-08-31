import {CommonModule} from '@angular/common';
import {HsConfirmDialog} from './confirm-dialog.service';
import {HsConfirmDialogComponent} from './confirm-dialog.component';
import {NgModule} from '@angular/core';
import {TranslateModule, TranslateStore} from '@ngx-translate/core';

@NgModule({
  declarations: [HsConfirmDialogComponent],
  imports: [CommonModule, TranslateModule],
  providers: [HsConfirmDialog, TranslateStore],
  bootstrap: [HsConfirmDialogComponent],
})
export class HsConfirmModule {}
