import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsCesiumCameraService} from './hscesium-camera.service';
import {HsCesiumLayersService} from './hscesium-layers.service';
import {HsCesiumService} from './hscesium.service';
import {HsCesiumTimeService} from './hscesium-time.service';
import {HslayersCesiumComponent} from './hscesium.component';
import {HslayersModule} from 'hslayers-ng';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HslayersCesiumComponent],
  imports: [CommonModule, NgbModule, HslayersModule],
  exports: [HslayersCesiumComponent],
  providers: [
    HsCesiumService,
    HsCesiumCameraService,
    HsCesiumLayersService,
    HsCesiumTimeService,
  ],
  entryComponents: [],
})
export class HsCesiumModule {}
