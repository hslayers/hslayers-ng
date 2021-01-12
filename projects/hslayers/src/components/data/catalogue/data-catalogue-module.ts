import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsDataCatalogueComponent} from './data-catalogue.component';
import {HsDataListItemComponent} from './data-list-item.component';
import {HsDataMetadataDialogComponent} from './data-catalogue-metadata-dialog.component';
import {HsUiExtensionsModule} from '../../../common/widgets/ui-extensions.module';
import {TranslateModule} from '@ngx-translate/core';

import {HsDataCatalogueMapService} from './data-catalogue-map.service';
import {HsLaymanBrowserService} from './layman/layman.service';
import {HsLaymanModule} from '../../../common/layman/layman.module';
import {HsMickaBrowserService} from './micka/micka.service';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [
    HsDataCatalogueComponent,
    HsDataListItemComponent,
    HsDataMetadataDialogComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HsUiExtensionsModule,
    HsLaymanModule,
  ],
  exports: [
    HsDataCatalogueComponent,
    HsDataListItemComponent,
    HsDataMetadataDialogComponent,
  ],
  providers: [
    HsMickaBrowserService,
    HsLaymanBrowserService,
    HsDataCatalogueMapService,
  ],
  entryComponents: [
    HsDataCatalogueComponent,
    HsDataListItemComponent,
    HsDataMetadataDialogComponent,
  ],
})
export class HsDataCatalogueModule {}
