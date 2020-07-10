import {BrowserModule} from '@angular/platform-browser';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsMeasureComponent} from './measure.component';
import {HsMeasureService} from './measure.service';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsMeasureComponent],
  imports: [CommonModule, BrowserModule, FormsModule, NgbModule],
  exports: [HsMeasureComponent],
  providers: [HsMeasureService],
  entryComponents: [HsMeasureComponent],
})
export class HsMeasureModule {}
