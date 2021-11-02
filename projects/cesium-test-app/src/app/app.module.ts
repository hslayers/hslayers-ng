import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {HsCesiumModule} from '../../../hslayers-cesium/src/public-api';
import {HslayersModule} from '../../../hslayers/src/public-api';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HslayersModule, HsCesiumModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
