import { NgModule } from '@angular/core';
import { HsCoreModule } from './components/core/core.module';
import { HsLayoutModule } from './components/layout/layout.module';
import { HslayersComponent } from './hslayers.component';

@NgModule({
  declarations: [HslayersComponent],
  imports: [HsCoreModule, HsLayoutModule
  ],
  exports: [HslayersComponent]
})
export class HslayersModule { }
