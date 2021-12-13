import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';

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
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        HsMatLayerManagerModule,
        HsMapModule,
    ],
    providers: [HsLayoutService],
    exports: [HsMatLayoutComponent, HsMatOverlayComponent]
})
export class HsMatLayoutModule {}
