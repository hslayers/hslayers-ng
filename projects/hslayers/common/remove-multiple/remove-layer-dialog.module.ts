import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {HsRmLayerDialogComponent} from './remove-layer-dialog.component';

@NgModule({
  declarations: [HsRmLayerDialogComponent],
  imports: [CommonModule, TranslatePipe],
  exports: [HsRmLayerDialogComponent],
})
export class HsRmLayerDialogModule {}
