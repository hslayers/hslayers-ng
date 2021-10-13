import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataFileComponent} from './file.component';
import {HsAddDataVectorModule} from '../vector/vector.module';
import {HsFileShpModule} from './shp/shp.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsAddDataFileComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    //
    HsFileShpModule,
    HsAddDataVectorModule,
  ],
  exports: [HsAddDataFileComponent],
  entryComponents: [HsAddDataFileComponent],
})
export class HsAddDataFileModule {}
