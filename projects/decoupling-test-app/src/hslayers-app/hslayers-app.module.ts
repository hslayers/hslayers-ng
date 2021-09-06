import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {HsAddDataCommonModule} from '../../../hslayers/src/components/add-data/common/add-data-common.module';
import {HsCompositionsModule} from '../../../hslayers/src/components/compositions/compositions.module';
import {HsCoreModule} from '../../../hslayers/src/components/core/core.module';
import {HsLayoutModule} from '../../../hslayers/src/components/layout/layout.module';
import {HsQueryModule} from '../../../hslayers/src/components/query/query.module';
import {HslayersAppComponent} from './hslayers-app.component';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  declarations: [HslayersAppComponent],
  imports: [
    BrowserModule,
    HsCoreModule,
    TranslateModule,
    HsAddDataCommonModule,
    HsCompositionsModule,
    HsLayoutModule,
  ],
  providers: [],
  bootstrap: [HslayersAppComponent],
})
export class AppModule {}
