import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {HsCoreModule} from '../../../hslayers/src/components/core/core.module';
/* import {
  HsGeolocationModule,
  HsInfoModule,
  HsSearchModule,
} from 'hslayers-ng/src/public-api'; */
import {HsLayoutModule} from '../../../hslayers/src/components/layout/layout.module';
//import {HsMeasureModule} from 'hslayers-ng/src/components/measure/public-api';
//import {HsDrawModule} from 'hslayers-ng/src/components/draw/public-api';
import {HsQueryModule} from 'hslayers-ng/src/components/query/query.module';
import {HslayersAppComponent} from './hslayers-app.component';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  declarations: [HslayersAppComponent],
  imports: [
    BrowserModule,
    HsCoreModule,
    TranslateModule,
    HsLayoutModule,
    //HsDrawModule,
    //HsMeasureModule,
    //HsSearchModule,
    //HsInfoModule,
    //HsGeolocationModule,
    HsQueryModule,
  ],
  providers: [],
  bootstrap: [HslayersAppComponent],
})
export class AppModule {}
