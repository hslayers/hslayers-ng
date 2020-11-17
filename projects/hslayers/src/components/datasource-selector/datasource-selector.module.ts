import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddLayersModule} from '../add-layers/add-layers.module';
import {HsAdvancedMickaDialogComponent} from './micka/advanced-micka-dialog.component';
import {HsDatasourceListItemComponent} from './datasource-list-item.component';
import {HsDatasourcesComponent} from './datasource-selector.component';
import {HsDatasourcesMapService} from './datasource-selector-map.service';
import {HsDatasourcesMetadataDialogComponent} from './datasource-metadata-dialog.component';
import {HsDatasourcesMetadataService} from './datasource-selector-metadata.service';
import {HsDatasourcesService} from './datasource-selector.service';
import {HsLaymanBrowserService} from './layman/layman.service';
import {HsLaymanModule} from '../../common/layman';
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
    HsDatasourcesComponent,
    HsDatasourcesMetadataDialogComponent,
    HsMickaFilterComponent,
    HsMickaSuggestionsDialogComponent,
    HsDatasourceListItemComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    HsAddLayersModule,
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
  ],
  providers: [
    HsDatasourcesService,
    HsDatasourcesMapService,
    HsDatasourcesMetadataService,
    HsLaymanBrowserService,
    HsMickaBrowserService,
    HsMickaFilterService,
  ],
  entryComponents: [
    HsDatasourcesComponent,
    HsDatasourcesMetadataDialogComponent,
  ],
})
export class HsDatasourcesModule {}
