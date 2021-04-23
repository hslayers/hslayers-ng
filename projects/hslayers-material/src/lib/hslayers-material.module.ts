import { HsCoreModule } from '../../../hslayers/src/components/core/core.module';
import { HsMatLayoutModule } from './layout/layout.module';
import { HslayersMaterialComponent } from './hslayers-material.component';
import { NgModule } from '@angular/core';

@NgModule({
  declarations: [HslayersMaterialComponent],
  imports: [
    HsCoreModule,
    HsMatLayoutModule
  ],
  exports: [HslayersMaterialComponent]
})
export class HslayersMaterialModule { }
