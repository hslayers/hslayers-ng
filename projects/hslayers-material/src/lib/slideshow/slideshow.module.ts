import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsMatImportsModule} from '../material-module';

import {HsMatSlideshowComponent} from './slideshow.component';
import {HsMatSlideshowService} from './slideshow.service';

@NgModule({
  declarations: [
    HsMatSlideshowComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    HsMatImportsModule
  ],
  providers: [HsMatSlideshowService],
  entryComponents: [HsMatSlideshowComponent],
})
export class HsMatSlideshowModule {}
