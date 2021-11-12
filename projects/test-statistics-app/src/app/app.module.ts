import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {HsCoreModule} from 'hslayers-ng';
import {HsLayoutModule} from 'hslayers-ng';
import {HsSearchModule} from 'hslayers-ng';
//import {HsMeasureModule} from 'hslayers-ng/src/components/measure/public-api';
//import {HsDrawModule} from 'hslayers-ng/src/components/draw/public-api';
import {HsLayerManagerModule, HsQueryModule, HsStylerModule} from 'hslayers-ng';
import {HsStatisticsModule} from '../lib/statistics.module';
import {HslayersAppComponent} from './app.component';
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
    HsSearchModule,
    //HsInfoModule,
    //HsGeolocationModule,
    HsQueryModule,
    HsLayerManagerModule,
    HsStylerModule,
    HsStatisticsModule,
  ],
  providers: [],
  bootstrap: [HslayersAppComponent],
})
export class AppModule {}
