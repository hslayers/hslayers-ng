import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {HslayersCesiumComponent} from 'hslayers-cesium';
import {HslayersComponent} from 'hslayers-ng/core';

import {AppComponent} from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HslayersComponent, HslayersCesiumComponent],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
