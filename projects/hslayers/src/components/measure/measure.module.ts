import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsMeasureComponent} from './measure.component';
import {HsMeasureToolbarComponent} from './measure-toolbar.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsMeasureComponent, HsMeasureToolbarComponent],
  imports: [
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    NgbModule,
    TranslateModule,
  ],
  exports: [HsMeasureComponent, HsMeasureToolbarComponent],
  entryComponents: [HsMeasureComponent, HsMeasureToolbarComponent],
})
export class HsMeasureModule {}
