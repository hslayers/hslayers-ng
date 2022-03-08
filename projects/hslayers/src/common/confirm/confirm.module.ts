import {CommonModule} from '@angular/common';

import {HsConfirmDialogComponent} from './confirm-dialog.component';
import {HsLanguageModule} from '../../components/language/language.module';
import {NgModule} from '@angular/core';

@NgModule({
  declarations: [HsConfirmDialogComponent],
  imports: [CommonModule, HsLanguageModule],
  exports: [HsConfirmDialogComponent],
})
export class HsConfirmModule {}
