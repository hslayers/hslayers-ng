import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {DragDropModule} from '@angular/cdk/drag-drop';

import {HsLanguageModule} from '../language/language.module';
import {HsMapSwipeComponent} from './map-swipe.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';

@NgModule({
  declarations: [HsMapSwipeComponent],
  imports: [
    CommonModule,
    HsPanelHelpersModule,
    FormsModule,
    HsLanguageModule,
    DragDropModule,
  ],
  exports: [HsMapSwipeComponent],
})
export class HsMapSwipeModule {}
