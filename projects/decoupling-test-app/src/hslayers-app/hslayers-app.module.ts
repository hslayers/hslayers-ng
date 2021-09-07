import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {HsCoreModule} from '../../../hslayers/src/components/core/core.module';
import {HsLayoutModule} from '../../../hslayers/src/components/layout/layout.module';
import {HsMeasureModule} from 'hslayers-ng/src/components/measure/public-api';
import {HsSearchModule} from 'hslayers-ng/src/public-api';
import {HslayersAppComponent} from './hslayers-app.component';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  declarations: [HslayersAppComponent],
  imports: [
    BrowserModule,
    HsCoreModule,
    TranslateModule,
    HsLayoutModule,
    HsMeasureModule,
    HsSearchModule,
  ],
  providers: [],
  bootstrap: [HslayersAppComponent],
})
export class AppModule {}
