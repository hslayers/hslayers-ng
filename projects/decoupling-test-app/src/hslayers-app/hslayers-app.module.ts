import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';

/* import {
  HsGeolocationModule,
  HsInfoModule,
  HsSearchModule,
} from 'hslayers-ng/public-api'; */
//import {HsMeasureModule} from 'hslayers-ng/components/measure/public-api';
//import {HsDrawModule} from 'hslayers-ng/components/draw/public-api';
import {HslayersComponent} from 'hslayers-ng/core';

import {HslayersAppComponent} from './hslayers-app.component';

@NgModule({
  declarations: [HslayersAppComponent],
  imports: [BrowserModule, FormsModule, HslayersComponent],
  providers: [provideHttpClient(withInterceptorsFromDi())],
  bootstrap: [HslayersAppComponent],
})
export class AppModule {}
