import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule, TranslateStore} from '@ngx-translate/core';

import {EndpointsWithDatasourcesPipe} from './endpoints-with-datasources.pipe';
import {HsAddLayersComponent} from '../add-layers/add-layers.upgraded.component'; //TODO: to be removed and redeclared in HsAddLayersModule
import {HsAdvancedMickaDialogComponent} from './micka/advanced-micka-dialog.component';
import {HsDatasourceListItemComponent} from './datasource-list-item.component';
import {HsDatasourcesComponent} from './datasource-selector.component';
import {HsDatasourcesMapService} from './datasource-selector-map.service';
import {HsDatasourcesMetadataDialogComponent} from './datasource-metadata-dialog.component';
import {HsDatasourcesMetadataService} from './datasource-selector-metadata.service';
import {HsDatasourcesService} from './datasource-selector.service';
import {HsLaymanBrowserService} from './layman/layman.service';
import {HsLaymanModule} from '../../common/layman';
import {HsMetadataDialogComponent} from './metadata-dialog.component';
import {HsMickaBrowserService} from './micka/micka.service';
import {HsMickaFilterComponent} from './micka/micka-filter.component';
import {HsMickaFilterService} from './micka/micka-filters.service';
import {HsMickaSuggestionsDialogComponent} from './micka/micka-suggestions-dialog.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsUiExtensionsModule} from '../../common/widgets/ui-extensions.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [
    HsAdvancedMickaDialogComponent,
    HsAddLayersComponent, //TODO: to be removed and redeclared in HsAddLayersModule
    HsDatasourcesComponent,
    HsDatasourcesMetadataDialogComponent,
    HsMickaFilterComponent,
    HsMickaSuggestionsDialogComponent,
    HsDatasourceListItemComponent,
    EndpointsWithDatasourcesPipe,
  ],
  imports: [
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    TranslateModule,
    HsLaymanModule,
    HsUiExtensionsModule,
  ],
  exports: [
    HsAdvancedMickaDialogComponent,
    HsDatasourcesComponent,
    HsDatasourcesMetadataDialogComponent,
    HsMickaFilterComponent,
    HsMickaSuggestionsDialogComponent,
    HsDatasourceListItemComponent,
    EndpointsWithDatasourcesPipe,
  ],
  providers: [
    HsDatasourcesService,
    HsDatasourcesMapService,
    HsDatasourcesMetadataService,
    HsLaymanBrowserService,
    HsMickaBrowserService,
    HsMickaFilterService,
    TranslateStore,
  ],
  entryComponents: [
    HsDatasourcesComponent,
    HsDatasourcesMetadataDialogComponent,
  ],
})
export class HsDatasourcesModule {}
