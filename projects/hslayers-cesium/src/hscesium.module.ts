import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsCesiumCameraService} from './hscesium-camera.service';
import {HsCesiumComponent} from './hscesium.component';
import {HsCesiumLayersService} from './hscesium-layers.service';
import {HsCesiumService} from './hscesium.service';
import {HsCesiumTimeService} from './hscesium-time.service';
import {HslayersModule} from 'hslayers-ng';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsCesiumComponent],
  imports: [CommonModule, NgbModule, HslayersModule],
  exports: [HsCesiumComponent],
  providers: [
    HsCesiumService,
    HsCesiumCameraService,
    HsCesiumLayersService,
    HsCesiumTimeService,
  ],
  entryComponents: [],
})
export class HsCesiumModule {}
