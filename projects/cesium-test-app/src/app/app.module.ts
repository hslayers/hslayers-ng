import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {HsCesiumModule} from 'hslayers-cesium';
import {HslayersModule} from 'hslayers-ng/core';

import {AppComponent} from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HslayersModule, HsCesiumModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
