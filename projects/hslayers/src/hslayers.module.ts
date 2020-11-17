import { NgModule } from '@angular/core';
import { HsCoreModule } from './components/core';
import { HsLayoutModule } from './components/layout';
import { HslayersComponent } from './hslayers.component';

@NgModule({
  declarations: [HslayersComponent],
  imports: [HsCoreModule, HsLayoutModule
  ],
  exports: [HslayersComponent]
})
export class HslayersModule { }
