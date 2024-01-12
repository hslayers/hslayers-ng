import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

/* import {
  HsGeolocationModule,
  HsInfoModule,
  HsSearchModule,
} from 'hslayers-ng/public-api'; */
//import {HsMeasureModule} from 'hslayers-ng/components/measure/public-api';
//import {HsDrawModule} from 'hslayers-ng/components/draw/public-api';
import {FormsModule} from '@angular/forms';
import {HslayersAppComponent} from './hslayers-app.component';
import {HslayersModule} from 'hslayers-ng';
import {HttpClientModule} from '@angular/common/http';

@NgModule({
  declarations: [HslayersAppComponent],
  imports: [HttpClientModule, BrowserModule, FormsModule, HslayersModule],
  providers: [],
  bootstrap: [HslayersAppComponent],
})
export class AppModule {}
