import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {ColormapPickerComponent} from './colormap-picker.component';
import {TranslateCustomPipe} from '../../components/language/translate-custom.pipe';

@NgModule({
  declarations: [ColormapPickerComponent],
  imports: [CommonModule, TranslateCustomPipe],
  exports: [ColormapPickerComponent],
})
export class HsColormapPickerModule {}
