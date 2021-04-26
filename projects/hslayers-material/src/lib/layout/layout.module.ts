import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';

import {HsAddDataModule} from '../../../../hslayers/src/components/add-data/add-data.module';
import {HsAttributionDialogComponent} from './attribution-dialog.component';
import {HsCompositionsModule} from '../../../../hslayers/src/components/compositions/compositions.module';
import {HsConfirmModule} from '../../../../hslayers/src/common/confirm/confirm.module';
import {HsDialogContainerComponent} from '../../../../hslayers/src/components/layout/dialogs/dialog-container.component';
import {HsDialogContainerService} from '../../../../hslayers/src/components/layout/dialogs/dialog-container.service';
import {HsDialogHostDirective} from '../../../../hslayers/src/components/layout/dialogs/dialog-host.directive';
import {HsDrawModule} from '../../../../hslayers/src/components/draw/draw.module';
import {HsFeatureTableModule} from '../../../../hslayers/src/components/feature-table/feature-table.module';
import {HsGeolocationModule} from '../../../../hslayers/src/components/geolocation/geolocation.module';
import {HsInfoModule} from '../../../../hslayers/src/components/info/info.module';
import {HsLanguageModule} from '../../../../hslayers/src/components/language/language.module';
import {HsLayoutHostDirective} from '../../../../hslayers/src/components/layout/layout.directive';
import {HsLayoutService} from '../../../../hslayers/src/components/layout/layout.service';
import {HsLegendModule} from '../../../../hslayers/src/components/legend/legend.module';
import {HsMapHostDirective} from './map-host.directive';
import {HsMapModule} from '../../../../hslayers/src/components/map/map.module';
import {HsMatLayerManagerModule} from '../layermanager/layermanager.module';
import {HsMatLayoutComponent} from './layout.component';
import {HsMatOverlayComponent} from './overlay.component';
import {HsMeasureModule} from '../../../../hslayers/src/components/measure/measure.module';
import {HsPanelHelpersModule} from '../../../../hslayers/src/components/layout/panels/panel-helpers.module';
import {HsPrintModule} from '../../../../hslayers/src/components/print/print.module';
import {HsQueryModule} from '../../../../hslayers/src/components/query/query.module';
import {HsSaveMapModule} from '../../../../hslayers/src/components/save-map/save-map.module';
import {HsSearchModule} from '../../../../hslayers/src/components/search/search.module';
import {HsShareModule} from '../../../../hslayers/src/components/permalink/share.module';
import {HsSidebarModule} from '../../../../hslayers/src/components/sidebar/sidebar.module';
import {HsStylerModule} from '../../../../hslayers/src/components/styles/styles.module';
import {HsThemeService} from '../../../../hslayers/src/components/layout/themes/theme.service';
import {HsToastModule} from '../../../../hslayers/src/components/layout/toast/toast.module';
import {HsToolbarModule} from '../../../../hslayers/src/components/toolbar/toolbar.module';
import {HsTripPlannerModule} from '../../../../hslayers/src/components/trip_planner/trip-planner.module';

@NgModule({
  declarations: [
    HsMapHostDirective,
    HsMatLayoutComponent,
    HsMatOverlayComponent,
    HsAttributionDialogComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    HsMatLayerManagerModule,
    HsMapModule,
  ],
  providers: [HsLayoutService],
  entryComponents: [HsMatLayoutComponent, HsMatOverlayComponent],
  exports: [HsMatLayoutComponent, HsMatOverlayComponent],
})
export class HsMatLayoutModule {}
