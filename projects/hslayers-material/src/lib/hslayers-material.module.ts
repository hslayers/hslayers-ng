import {NgModule} from '@angular/core';

import {HsCoreModule} from 'hslayers-ng';

import {HsMatLayoutModule} from './layout/layout.module';
import {HsMatSlideshowModule} from './slideshow/slideshow.module';
import {HslayersMaterialComponent} from './hslayers-material.component';

@NgModule({
  declarations: [HslayersMaterialComponent],
  imports: [HsCoreModule, HsMatLayoutModule, HsMatSlideshowModule],
  exports: [HslayersMaterialComponent],
})
export class HslayersMaterialModule {}
