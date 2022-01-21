import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataFileBaseComponent} from './file-base.component';
import {HsAddDataFileComponent} from './file.component';
import {HsAddDataVectorModule} from '../vector/vector.module';
import {HsFileShpModule} from './shp/shp.module';
import {HsRasterImagesModule} from './raster-images/raster-images.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsAddDataFileComponent, HsAddDataFileBaseComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HsFileShpModule,
    HsAddDataVectorModule,
    HsRasterImagesModule,
  ],
  exports: [HsAddDataFileComponent, HsAddDataFileBaseComponent],
})
export class HsAddDataFileModule {}
