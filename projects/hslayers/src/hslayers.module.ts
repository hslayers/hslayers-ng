import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';

import {HsLayoutModule} from 'hslayers-ng/components/layout';
import {HslayersComponent} from './hslayers.component';

@NgModule({
  declarations: [HslayersComponent],
  imports: [HttpClientModule, HsLayoutModule],
  exports: [HslayersComponent, HsLayoutModule],
})
export class HslayersModule {}
