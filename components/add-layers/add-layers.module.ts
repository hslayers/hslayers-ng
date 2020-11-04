import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddLayersArcGisModule} from './arcgis';
import {HsAddLayersComponent} from './add-layers.component';
import {HsAddLayersShpModule} from './shp';
import {HsAddLayersVectorModule} from './vector';
import {HsAddLayersWfsModule} from './wfs/add-layers-wfs.module';
import {HsAddLayersWmsModule} from './wms';
import {HsAddLayersWmtsModule} from './wmts';
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
    HsAddLayersArcGisModule,
    HsAddLayersShpModule,
    HsAddLayersWmsModule,
    HsAddLayersWmtsModule,
    HsAddLayersWfsModule,
  ],
  exports: [
    HsAddLayersComponent,
    HsGetCapabilitiesErrorComponent,
    HsNestedLayersTableComponent,
    HsResampleDialogComponent,
  ],
  declarations: [
    HsAddLayersComponent,
    HsGetCapabilitiesErrorComponent,
    HsNestedLayersTableComponent,
    HsResampleDialogComponent,
  ],
  providers: [HsDragDropLayerService],
})
export class HsAddLayersModule {}
