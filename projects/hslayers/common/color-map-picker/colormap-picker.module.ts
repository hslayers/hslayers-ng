import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {ColormapPickerComponent} from './colormap-picker.component';

@NgModule({
  declarations: [ColormapPickerComponent],
  imports: [CommonModule, TranslatePipe],
  exports: [ColormapPickerComponent],
})
export class HsColormapPickerModule {}
