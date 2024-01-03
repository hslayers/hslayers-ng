import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {HsConfirmDialogComponent} from './confirm-dialog.component';
import {TranslateCustomPipe} from 'hslayers-ng/components/language';

@NgModule({
  declarations: [HsConfirmDialogComponent],
  imports: [CommonModule, TranslateCustomPipe],
  exports: [HsConfirmDialogComponent],
})
export class HsConfirmModule {}
