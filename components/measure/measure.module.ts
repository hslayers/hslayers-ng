import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsMeasureComponent} from './measure.component';
import {HsMeasureService} from './measure.service';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsMeasureComponent],
  imports: [
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    NgbModule,
    TranslateModule,
  ],
  exports: [HsMeasureComponent],
  providers: [HsMeasureService],
  entryComponents: [HsMeasureComponent],
})
export class HsMeasureModule {}
