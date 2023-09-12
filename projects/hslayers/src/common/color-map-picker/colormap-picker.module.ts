import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {ColormapPickerComponent} from './colormap-picker.component';
import {HsLanguageModule} from '../../components/language/language.module';

@NgModule({
  declarations: [ColormapPickerComponent],
  imports: [CommonModule, HsLanguageModule],
  exports: [ColormapPickerComponent],
})
export class HsColormapPickerModule {}
