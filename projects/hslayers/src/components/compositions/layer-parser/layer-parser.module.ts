import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {HsCompositionsLayerParserService} from './layer-parser.service';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [],
  imports: [TranslateModule],
  exports: [],
  providers: [HsCompositionsLayerParserService],
  entryComponents: [],
})
export class HsCompositionsLayerParserModule {}
