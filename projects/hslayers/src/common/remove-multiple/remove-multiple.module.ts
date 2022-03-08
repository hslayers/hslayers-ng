import {CommonModule} from '@angular/common';
import {HsLanguageModule} from '../../components/language/language.module';
import {HsRmMultipleDialogComponent} from './remove-multiple-dialog.component';
import {NgModule} from '@angular/core';

@NgModule({
  declarations: [HsRmMultipleDialogComponent],
  imports: [CommonModule, HsLanguageModule],
  exports: [HsRmMultipleDialogComponent],
})
export class HsRmMultipleModule {}
