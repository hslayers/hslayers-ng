import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSliderModule} from '@angular/material/slider';
import {MatTreeModule} from '@angular/material/tree';

import {HsLayerManagerService} from 'hslayers-ng';
import {HsMatLayerManagerComponent} from './layermanager.component';

@NgModule({
    declarations: [HsMatLayerManagerComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [
        CommonModule,
        MatButtonModule,
        MatCheckboxModule,
        MatDialogModule,
        MatIconModule,
        MatSliderModule,
        MatTreeModule,
    ],
    providers: [HsLayerManagerService],
    exports: [HsMatLayerManagerComponent]
})
export class HsMatLayerManagerModule {}
