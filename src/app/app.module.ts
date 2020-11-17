import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {HslayersModule} from 'projects/hslayers/src/public-api';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HslayersModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
