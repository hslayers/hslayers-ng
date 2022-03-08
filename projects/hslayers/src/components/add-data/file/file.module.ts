import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsAddDataFileBaseComponent} from './file-base.component';
import {HsAddDataFileComponent} from './file.component';
import {HsAddDataVectorModule} from '../vector/vector.module';
import {HsFileRasterModule} from './raster/raster.module';
import {HsFileShpModule} from './shp/shp.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsAddDataFileComponent, HsAddDataFileBaseComponent],
  imports: [
    CommonModule,
    FormsModule,
    HsFileShpModule,
    HsAddDataVectorModule,
    HsFileRasterModule,
  ],
  exports: [HsAddDataFileComponent, HsAddDataFileBaseComponent],
})
export class HsAddDataFileModule {}
