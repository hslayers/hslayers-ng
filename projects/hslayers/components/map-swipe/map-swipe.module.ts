import {CommonModule} from '@angular/common';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {HsMapSwipeComponent} from './map-swipe.component';
import {HsPanelHeaderComponent} from 'hslayers-ng/common/panels';

@NgModule({
  declarations: [HsMapSwipeComponent],
  imports: [
    CommonModule,
    HsPanelHeaderComponent,
    FormsModule,
    TranslatePipe,
    DragDropModule,
  ],
  exports: [HsMapSwipeComponent],
})
export class HsMapSwipeModule {}
