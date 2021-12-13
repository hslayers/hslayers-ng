//TODO: Is this module declaration needed at all?
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [],
  imports: [TranslateModule],
  exports: [],
})
export class HsCompositionsLayerParserModule {}
