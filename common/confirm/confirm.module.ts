import {CommonModule} from '@angular/common';
import {HsConfirmDialog} from './confirm-dialog.service';
import {HsConfirmDialogComponent} from './confirm-dialog.component';
import {NgModule} from '@angular/core';

@NgModule({
  declarations: [HsConfirmDialogComponent],
  imports: [CommonModule],
  providers: [HsConfirmDialog],
  bootstrap: [HsConfirmDialogComponent],
})
export class HsConfirmModule {}
