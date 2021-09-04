import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsAddDataFileComponent} from './add-data-file.component';
import {HsAddDataFileShpModule} from './shp/add-data-file-shp.module';
import {HsAddDataVectorModule} from '../vector/add-data-vector.module';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsAddDataFileComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    //
    HsAddDataFileShpModule,
    HsAddDataVectorModule,
  ],
  exports: [HsAddDataFileComponent],
  entryComponents: [HsAddDataFileComponent],
})
export class HsAddDataFileModule {}
