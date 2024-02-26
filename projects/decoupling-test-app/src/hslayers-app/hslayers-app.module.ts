import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';

/* import {
  HsGeolocationModule,
  HsInfoModule,
  HsSearchModule,
} from 'hslayers-ng/public-api'; */
//import {HsMeasureModule} from 'hslayers-ng/components/measure/public-api';
//import {HsDrawModule} from 'hslayers-ng/components/draw/public-api';
import {HslayersModule} from 'hslayers-ng';

import {HslayersAppComponent} from './hslayers-app.component';

@NgModule({
  declarations: [HslayersAppComponent],
  imports: [HttpClientModule, BrowserModule, FormsModule, HslayersModule],
  providers: [],
  bootstrap: [HslayersAppComponent],
})
export class AppModule {}
