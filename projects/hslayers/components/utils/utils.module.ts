import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';

import {HsLayerUtilsService} from './layer-utils.service';
import {HsUtilsService} from './utils.service';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [],
  providers: [HsLayerUtilsService, HsUtilsService],
})
export class HsUtilsModule {}
