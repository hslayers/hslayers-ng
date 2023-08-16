import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {HsConfirmDialogComponent} from './confirm-dialog.component';
import {HsLanguageModule} from '../../components/language/language.module';

@NgModule({
  declarations: [HsConfirmDialogComponent],
  imports: [CommonModule, HsLanguageModule],
  exports: [HsConfirmDialogComponent],
})
export class HsConfirmModule {}
