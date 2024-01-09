import {HTTP_INTERCEPTORS} from '@angular/common/http';
import {NgModule} from '@angular/core';

import {HsAddDataModule} from 'hslayers-ng/components/add-data';
import {HsCompositionsModule} from 'hslayers-ng/components/compositions';
import {HsDrawModule} from 'hslayers-ng/components/draw';
import {HsFeatureTableModule} from 'hslayers-ng/components/feature-table';
import {HsGeolocationModule} from 'hslayers-ng/components/geolocation';
import {HsInfoModule} from 'hslayers-ng/components/info';
import {HsLanguageModule} from 'hslayers-ng/components/language';
import {HsLayerManagerModule} from 'hslayers-ng/components/layer-manager';
import {HsLayoutModule} from 'hslayers-ng/components/layout';
import {HsLegendModule} from 'hslayers-ng/components/legend';
import {HsMapSwipeModule} from 'hslayers-ng/components/map-swipe';
import {HsMeasureModule} from 'hslayers-ng/components/measure';
import {HsQueryModule} from 'hslayers-ng/components/query';
import {HsSaveMapModule} from 'hslayers-ng/components/save-map';
import {HsSearchModule} from 'hslayers-ng/components/search';
import {HsShareModule} from 'hslayers-ng/components/share';
import {HsStylerModule} from 'hslayers-ng/components/styler';
import {HsToolbarModule} from 'hslayers-ng/components/toolbar';
import {HsTripPlannerModule} from 'hslayers-ng/components/trip-planner';
import {HslayersComponent} from './hslayers.component';
import {HslayersLaymanInterceptor} from './hslayers.layman.interceptor';
import {PrintModule} from 'hslayers-ng/components/print';

@NgModule({
  declarations: [HslayersComponent],
  imports: [
    HsLayoutModule,
    HsLayerManagerModule,
    HsMeasureModule,
    HsAddDataModule,
    HsDrawModule,
    HsGeolocationModule,
    HsInfoModule,
    HsLanguageModule,
    HsLegendModule,
    HsTripPlannerModule,
    HsSaveMapModule,
    HsFeatureTableModule,
    HsShareModule,
    HsQueryModule,
    HsSearchModule,
    HsCompositionsModule,
    HsStylerModule,
    HsToolbarModule,
    HsMapSwipeModule,
    PrintModule,
  ],
  exports: [HslayersComponent, HsLayoutModule],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HslayersLaymanInterceptor,
      multi: true,
    },
  ],
})
export class HslayersModule {}
