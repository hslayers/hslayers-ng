import {CommonModule} from '@angular/common';
import {HsLanguageModule} from '../../components/language/language.module';
import {HsRmLayerDialogComponent} from './remove-layer-dialog.component';
import {NgModule} from '@angular/core';

@NgModule({
  declarations: [HsRmLayerDialogComponent],
  imports: [CommonModule, HsLanguageModule],
  exports: [HsRmLayerDialogComponent],
})
export class HsRmLayerDialogModule {}
