import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {TranslateCustomPipe} from '../../components/language/translate-custom.pipe';
import {HsRmLayerDialogComponent} from './remove-layer-dialog.component';

@NgModule({
  declarations: [HsRmLayerDialogComponent],
  imports: [CommonModule, TranslateCustomPipe],
  exports: [HsRmLayerDialogComponent],
})
export class HsRmLayerDialogModule {}
