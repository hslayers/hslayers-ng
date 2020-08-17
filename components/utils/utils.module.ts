import {BrowserModule} from '@angular/platform-browser';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {HsLayerUtilsService} from './layer-utils.service';
import {HsUtilsService} from './utils.service';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  imports: [BrowserModule],
  providers: [HsLayerUtilsService, HsUtilsService],
})
export class HsUtilsModule {}
