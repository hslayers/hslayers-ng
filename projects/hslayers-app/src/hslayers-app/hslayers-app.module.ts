import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {HslayersAppComponent} from './hslayers-app.component';
import {HslayersModule} from '../../../hslayers/src/public-api';

@NgModule({
  declarations: [HslayersAppComponent],
  imports: [BrowserModule, HslayersModule],
  providers: [],
  bootstrap: [HslayersAppComponent],
})
export class AppModule {}
