import {BrowserModule} from '@angular/platform-browser';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {EndpointsWithDatasourcesPipe} from './endpoints-with-datasources.pipe';
import {HsAdvancedMickaDialogComponent} from './micka/advanced-micka-dialog.component';
import {HsDatasourcesComponent} from './datasource-selector.component';
import {HsDatasourcesMapService} from './datasource-selector-map.service';
import {HsDatasourcesService} from './datasource-selector.service';
import {HsLaymanBrowserService} from './layman/layman.service';
import {HsMetadataDialogComponent} from './metadata-dialog.component';
import {HsMickaBrowserService} from './micka/micka.service';
import {HsMickaFilterComponent} from './micka/micka-filter.component';
import {HsMickaFilterService} from './micka/micka-filters.service';
import {HsMickaSuggestionsDialogComponent} from './micka/micka-suggestions-dialog.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsSelectTypeToAddLayerDialogComponent} from './select-type-to-add-layer-dialog.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsDatasourcesComponent,
    HsMetadataDialogComponent,
    HsSelectTypeToAddLayerDialogComponent,
    HsMickaFilterComponent,
    HsMickaSuggestionsDialogComponent,
    HsAdvancedMickaDialogComponent,
    EndpointsWithDatasourcesPipe,
  ],
  imports: [BrowserModule, CommonModule, FormsModule, HsPanelHelpersModule],
  exports: [HsDatasourcesComponent, HsSelectTypeToAddLayerDialogComponent],
  providers: [
    HsDatasourcesService,
    HsDatasourcesMapService,
    HsLaymanBrowserService,
    HsMickaBrowserService,
    HsMickaFilterService,
  ],
  entryComponents: [HsDatasourcesComponent],
})
export class HsDatasourcesModule {}
