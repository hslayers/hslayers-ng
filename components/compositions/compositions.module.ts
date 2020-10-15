import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsCompositionsComponent} from './compositions.component';
import {HsCompositionsLayerParserModule} from './layer-parser/layer-parser.module';
import {HsCompositionsService} from './compositions.service';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsCompositionsComponent],
  imports: [
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    TranslateModule,
    HsCompositionsLayerParserModule,
    NgbModule,
  ],
  exports: [HsCompositionsComponent],
  providers: [HsCompositionsService],
  entryComponents: [HsCompositionsComponent],
})
export class HsCompositionsModule {}
