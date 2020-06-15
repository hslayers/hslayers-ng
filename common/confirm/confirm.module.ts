import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HsConfirmDialogComponent } from './confirm-dialog.component';
import { HsConfirmDialog } from './confirm-dialog.service';

@NgModule({
  declarations: [
    HsConfirmDialogComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [HsConfirmDialog],
  bootstrap: [HsConfirmDialogComponent]
})
export class HsConfirmModule { }