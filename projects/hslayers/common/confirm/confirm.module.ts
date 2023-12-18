import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {HsConfirmDialogComponent} from './confirm-dialog.component';
import {TranslateCustomPipe} from '../../components/language/translate-custom.pipe';

@NgModule({
  declarations: [HsConfirmDialogComponent],
  imports: [CommonModule, TranslateCustomPipe],
  exports: [HsConfirmDialogComponent],
})
export class HsConfirmModule {}
