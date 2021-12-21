import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {DragDropModule} from '@angular/cdk/drag-drop';

import {HsMapSwipeComponent} from './map-swipe.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  declarations: [HsMapSwipeComponent],
  imports: [
    CommonModule,
    HsPanelHelpersModule,
    FormsModule,
    TranslateModule,
    DragDropModule,
  ],
  exports: [HsMapSwipeComponent],
  entryComponents: [HsMapSwipeComponent],
})
export class HsMapSwipeModule {}
