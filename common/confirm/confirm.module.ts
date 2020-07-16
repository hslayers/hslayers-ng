import {BrowserModule} from '@angular/platform-browser';
import {HsConfirmDialog} from './confirm-dialog.service';
import {HsConfirmDialogComponent} from './confirm-dialog.component';
import {NgModule} from '@angular/core';

@NgModule({
  declarations: [HsConfirmDialogComponent],
  imports: [BrowserModule],
  providers: [HsConfirmDialog],
  bootstrap: [HsConfirmDialogComponent],
})
export class HsConfirmModule {}
