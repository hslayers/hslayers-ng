import {HTTP_INTERCEPTORS} from '@angular/common/http';
import {NgModule} from '@angular/core';

import {HsAddDataModule} from './components/add-data/add-data.module';
import {HsCompositionsModule} from './components/compositions/compositions.module';
import {HsCoreModule} from './components/core/core.module';
import {HsDrawModule} from './components/draw/draw.module';
import {HsFeatureTableModule} from './components/feature-table/feature-table.module';
import {HsGeolocationModule} from './components/geolocation/geolocation.module';
import {HsInfoModule} from './components/info/info.module';
import {HsLanguageModule} from './components/language/language.module';
import {HsLayerManagerModule} from './components/layermanager/layermanager.module';
import {HsLayoutModule} from './components/layout/layout.module';
import {HsLegendModule} from './components/legend/legend.module';
import {HsMapSwipeModule} from './components/map-swipe/map-swipe.module';
import {HsMeasureModule} from './components/measure/measure.module';
import {HsPrintModule} from './components/print/print.module';
import {HsQueryModule} from './components/query/query.module';
import {HsSaveMapModule} from './components/save-map/save-map.module';
import {HsSearchModule} from './components/search/search.module';
import {HsShareModule} from './components/permalink/share.module';
import {HsStylerModule} from './components/styles/styles.module';
import {HsToolbarModule} from './components/toolbar/toolbar.module';
import {HsTripPlannerModule} from './components/trip-planner/trip-planner.module';
import {HslayersComponent} from './hslayers.component';
import {HslayersLaymanInterceptor} from './hslayers.layman.interceptor';
import {TranslateCustomPipe} from './components/language/translate-custom.pipe';

@NgModule({
  declarations: [HslayersComponent],
  imports: [
    HsCoreModule,
    HsLayoutModule,
    HsLayerManagerModule,
    HsMeasureModule,
    HsAddDataModule,
    HsDrawModule,
    HsGeolocationModule,
    HsInfoModule,
    HsLanguageModule,
    TranslateCustomPipe,
    HsLegendModule,
    HsTripPlannerModule,
    HsSaveMapModule,
    HsFeatureTableModule,
    HsPrintModule,
    HsShareModule,
    HsQueryModule,
    HsSearchModule,
    HsCompositionsModule,
    HsStylerModule,
    HsToolbarModule,
    HsMapSwipeModule,
  ],
  exports: [HslayersComponent],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HslayersLaymanInterceptor,
      multi: true,
    },
  ],
})
export class HslayersModule {}
