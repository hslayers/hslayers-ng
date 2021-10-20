import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsMatImportsModule} from '../material-module';

import {HsAttributionDialogComponent} from './attribution-dialog.component';
import {HsLayoutService, HsMapModule} from 'hslayers-ng';
import {HsMapHostDirective} from './map-host.directive';
import {HsMatLayerManagerModule} from '../layermanager/layermanager.module';
import {HsMatLayoutComponent} from './layout.component';
import {HsMatOverlayComponent} from './overlay.component';

@NgModule({
  declarations: [
    HsMapHostDirective,
    HsMatLayoutComponent,
    HsMatOverlayComponent,
    HsAttributionDialogComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    HsMatImportsModule,
    HsMatLayerManagerModule,
    HsMapModule,
  ],
  providers: [HsLayoutService],
  entryComponents: [HsMatLayoutComponent, HsMatOverlayComponent],
  exports: [HsMatLayoutComponent, HsMatOverlayComponent],
})
export class HsMatLayoutModule {}
