import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {DragDropModule} from '@angular/cdk/drag-drop';

import {HsMapSwipeComponent} from './map-swipe.component';
import {HsPanelHeaderComponent} from '../layout/panels/panel-header/panel-header.component';
import {TranslateCustomPipe} from '../language/translate-custom.pipe';

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
