import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {DragDropModule} from '@angular/cdk/drag-drop';

import {HsMapSwipeComponent} from './map-swipe.component';
import {HsPanelHeaderComponent} from 'hslayers-ng/common/panels';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';

@NgModule({
  declarations: [HsMapSwipeComponent],
  imports: [
    CommonModule,
    HsPanelHeaderComponent,
    FormsModule,
    TranslateCustomPipe,
    DragDropModule,
  ],
  exports: [HsMapSwipeComponent],
})
export class HsMapSwipeModule {}
