import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {HsRmLayerDialogComponent} from './remove-layer-dialog.component';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@NgModule({
  declarations: [HsRmLayerDialogComponent],
  imports: [CommonModule, TranslateCustomPipe],
  exports: [HsRmLayerDialogComponent],
})
export class HsRmLayerDialogModule {}
