import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsCompositionsModule} from '../compositions/compositions.module';
import {HsConfirmModule} from './../../common/confirm/confirm.module';
import {HsDatasourcesModule} from '../datasource-selector/datasource-selector.module';
import {HsDialogContainerComponent} from './dialogs/dialog-container.component';
import {HsDialogContainerService} from './dialogs/dialog-container.service';
import {HsDialogHostDirective} from './dialogs/dialog-host.directive';
import {HsDrawModule} from '../draw/draw.module';
import {HsFeatureTableModule} from '../feature-table/feature-table.module';
import {HsGeolocationModule} from '../geolocation/geolocation.module';
import {HsInfoModule} from '../info/info.module';
import {HsLanguageModule} from '../language/language.module';
import {HsLayerManagerModule} from '../layermanager/layermanager.module';
import {HsLayoutComponent} from './layout.component';
import {HsLayoutHostDirective} from './layout.directive';
import {HsLayoutService} from './layout.service';
import {HsLegendModule} from '../legend/legend.module';
import {HsMapHostDirective} from './map-host.directive';
import {HsMapModule} from '../map/map.module';
import {HsMeasureModule} from '../measure/measure.module';
import {HsPanelHelpersModule} from './panels/panel-helpers.module';
import {HsPrintModule} from '../print/print.module';
import {HsQueryModule} from '../query/query.module';
import {HsSaveMapModule} from '../save-map/save-map.module';
import {HsSearchModule} from '../search/search.module';
import {HsShareModule} from '../permalink/share.module';
import {HsSidebarModule} from '../sidebar/sidebar.module';
import {HsStylerModule} from '../styles/styles.module';
import {HsToolbarModule} from '../toolbar/toolbar.module';
import {HsTripPlannerModule} from '../trip_planner/trip-planner.module';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  declarations: [
    HsDialogContainerComponent,
    HsDialogHostDirective,
    HsMapHostDirective,
    HsLayoutComponent,
    HsLayoutHostDirective,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    TranslateModule,
    HsConfirmModule,
    HsMapModule,
    HsLayerManagerModule,
    HsGeolocationModule,
    HsToolbarModule,
    HsInfoModule,
    HsSidebarModule,
    HsLegendModule,
    HsDatasourcesModule,
    HsCompositionsModule,
    HsMeasureModule,
    HsPrintModule,
    HsShareModule,
    HsStylerModule,
    HsQueryModule,
    HsSaveMapModule,
    HsLanguageModule,
    HsFeatureTableModule,
    HsSearchModule,
    HsTripPlannerModule,
    HsDrawModule,
    HsPanelHelpersModule,
  ],
  providers: [HsLayoutService, HsDialogContainerService],
  entryComponents: [HsDialogContainerComponent, HsLayoutComponent],
  exports: [HsDialogContainerComponent, HsLayoutComponent],
})
export class HsLayoutModule {
  ngDoBootstrap(): void {}
}
