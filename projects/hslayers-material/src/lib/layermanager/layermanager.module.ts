import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsMatImportsModule} from '../material-module';

import {HsLayerManagerService} from 'hslayers-ng';
import {HsMatLayerManagerComponent} from './layermanager.component';

@NgModule({
  declarations: [HsMatLayerManagerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    HsMatImportsModule,
  ],
  providers: [HsLayerManagerService],
  entryComponents: [HsMatLayerManagerComponent],
  exports: [HsMatLayerManagerComponent],
})
export class HsMatLayerManagerModule {}
