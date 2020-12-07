import {HsCoreModule} from './components/core/core.module';
import {HsLayoutModule} from './components/layout/layout.module';
import {HslayersComponent} from './hslayers.component';
import {NgModule} from '@angular/core';

@NgModule({
  declarations: [HslayersComponent],
  imports: [HsCoreModule, HsLayoutModule],
  exports: [HslayersComponent],
})
export class HslayersModule {}
