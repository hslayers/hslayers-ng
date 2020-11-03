import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddLayersComponent} from './add-layers.component';
import {HsAddLayersUrlComponent} from './add-layers-url.component';
import {HsAddLayersVectorModule} from './vector';
import {HsDragDropLayerService} from './drag-drop-layer.service';
import {HsGetCapabilitiesErrorComponent} from './capabilities-error.component';
import {HsNestedLayersTableComponent} from './nested-layers-table.component';
import {HsResampleDialogComponent} from './resample-dialog.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HsAddLayersVectorModule,
  ],
  exports: [
    HsAddLayersComponent,
    HsAddLayersUrlComponent,
    HsGetCapabilitiesErrorComponent,
    HsNestedLayersTableComponent,
    HsResampleDialogComponent,
  ],
  declarations: [
    HsAddLayersComponent,
    HsAddLayersUrlComponent,
    HsGetCapabilitiesErrorComponent,
    HsNestedLayersTableComponent,
    HsResampleDialogComponent,
  ],
  providers: [HsDragDropLayerService],
})
export class HsAddLayersModule {}
