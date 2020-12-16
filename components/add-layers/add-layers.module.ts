import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddLayersArcGisModule} from './arcgis/add-layers-arcgis.module';
import {HsAddLayersComponent} from './add-layers.component';
import {HsAddLayersShpModule} from './shp/add-layers-shp.module';
import {HsAddLayersVectorModule} from './vector/add-layers-vector.module';
import {HsAddLayersWfsModule} from './wfs/add-layers-wfs.module';
import {HsAddLayersWmsModule} from './wms/add-layers-wms.module';
import {HsAddLayersWmtsModule} from './wmts/add-layers-wmts.module';
import {HsDragDropLayerService} from './drag-drop-layer.service';
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
  exports: [HsAddLayersComponent, HsResampleDialogComponent],
  declarations: [HsAddLayersComponent, HsResampleDialogComponent],
  providers: [HsDragDropLayerService],
})
export class HsAddLayersModule {}
