import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsAddDataCatalogueComponent} from './add-data-catalogue.component';
import {HsAddDataListItemComponent} from './add-data-list-item.component';
import {HsAddDataMetadataDialogComponent} from './add-data-catalogue-metadata-dialog.component';
import {HsUiExtensionsModule} from '../../../common/widgets/ui-extensions.module';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCatalogueMapService} from './add-data-catalogue-map.service';
import {HsAddDataCatalogueService} from './add-data-catalogue.service';
import {HsLaymanBrowserService} from './layman/layman.service';
import {HsLaymanModule} from '../../../common/layman/layman.module';
import {HsMickaBrowserService} from './micka/micka.service';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [
    HsAddDataCatalogueComponent,
    HsAddDataListItemComponent,
    HsAddDataMetadataDialogComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HsUiExtensionsModule,
    HsLaymanModule,
  ],
  exports: [
    HsAddDataCatalogueComponent,
    HsAddDataListItemComponent,
    HsAddDataMetadataDialogComponent,
  ],
  providers: [
    HsMickaBrowserService,
    HsLaymanBrowserService,
    HsAddDataCatalogueMapService,
    HsAddDataCatalogueService,
  ],
  entryComponents: [
    HsAddDataCatalogueComponent,
    HsAddDataListItemComponent,
    HsAddDataMetadataDialogComponent,
  ],
})
export class HsAddDataCatalogueModule {}
