import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsAddDataCatalogueModule} from './catalogue/catalogue.module';
import {HsAddDataComponent} from './add-data.component';
import {HsAddDataFileModule} from './file/file.module';
import {HsAddDataUrlModule} from './url/add-data-url.module';
import {TranslateCustomPipe} from '../language/translate-custom.pipe';
import {HsLayerOverwriteDialogComponent} from './dialog-overwrite-layer/overwrite-layer.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsRenameLayerDialogComponent} from './dialog-rename-layer/rename-layer.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsAddDataComponent,
    HsLayerOverwriteDialogComponent,
    HsRenameLayerDialogComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    TranslateCustomPipe,
    HsPanelHelpersModule,
    HsAddDataUrlModule,
    HsAddDataFileModule,
    HsAddDataCatalogueModule,
  ],
  exports: [HsAddDataComponent],
})
export class HsAddDataModule {}
