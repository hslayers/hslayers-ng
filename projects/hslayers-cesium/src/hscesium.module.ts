import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';

import {HslayersModule} from 'hslayers-ng/core';

import {HsCesiumCameraService} from './hscesium-camera.service';
import {HsCesiumConfig} from './hscesium-config.service';
import {HsCesiumLayersService} from './hscesium-layers.service';
import {HsCesiumService} from './hscesium.service';
import {HsCesiumTimeService} from './hscesium-time.service';
import {HslayersCesiumComponent} from './hscesium.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HslayersCesiumComponent],
  imports: [CommonModule, HslayersModule],
  exports: [HslayersCesiumComponent],
  providers: [
    HsCesiumService,
    HsCesiumConfig,
    HsCesiumCameraService,
    HsCesiumLayersService,
    HsCesiumTimeService,
  ],
})
export class HsCesiumModule {}
