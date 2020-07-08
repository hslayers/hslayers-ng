import {BrowserModule} from '@angular/platform-browser';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsMeasureComponent} from './measure.component';
import {HsMeasureService} from './measure.service';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsMeasureComponent],
  imports: [CommonModule, BrowserModule],
  exports: [HsMeasureComponent],
  providers: [HsMeasureService],
  entryComponents: [HsMeasureComponent],
})
export class HsMeasureModule {}
