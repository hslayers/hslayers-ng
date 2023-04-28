import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {HsLanguageModule} from '../../components/language/language.module';
import {HsRmLayerDialogComponent} from './remove-layer-dialog.component';

@NgModule({
  declarations: [HsRmLayerDialogComponent],
  imports: [CommonModule, HsLanguageModule],
  exports: [HsRmLayerDialogComponent],
})
export class HsRmLayerDialogModule {}
