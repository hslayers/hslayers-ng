import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsCompositionsModule} from '../compositions';
import {HsConfirmModule} from './../../common/confirm/confirm.module';
import {HsDatasourcesModule} from '../datasource-selector';
import {HsDialogContainerComponent} from './dialogs/dialog-container.component';
import {HsDialogContainerService} from './dialogs/dialog-container.service';
import {HsDialogHostDirective} from './dialogs/dialog-host.directive';
import {HsDrawModule} from '../draw';
import {HsFeatureTableModule} from '../feature-table';
import {HsGeolocationModule} from '../geolocation';
import {HsInfoModule} from '../info';
import {HsLanguageModule} from '../language';
import {HsLayerManagerModule} from '../layermanager';
import {HsLayoutComponent} from './layout.component';
import {HsLayoutHostDirective} from './layout.directive';
import {HsLayoutService} from './layout.service';
import {HsLegendModule} from '../legend';
import {HsMapModule} from '../map';
import {HsMeasureModule} from '../measure';
import {HsPanelHelpersModule} from './panels/panel-helpers.module';
import {HsPrintModule} from '../print';
import {HsQueryModule} from '../query';
import {HsSaveMapModule} from '../save-map';
import {HsSearchModule} from '../search';
import {HsShareModule} from '../permalink';
import {HsSidebarModule} from '../sidebar';
import {HsStylerModule} from '../styles';
import {HsToolbarModule} from '../toolbar';
import {HsTripPlannerModule} from '../trip_planner';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  declarations: [
    HsDialogContainerComponent,
    HsDialogHostDirective,
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
