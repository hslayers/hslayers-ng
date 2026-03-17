import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {HslayersCesiumComponent} from 'hslayers-cesium';
import {HslayersModule} from 'hslayers-ng/core';

import {AppComponent} from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HslayersModule, HslayersCesiumComponent],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
