import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BrowserModule} from '@angular/platform-browser';
import {HslayersMaterialModule} from 'hslayers-material';
import {NgModule} from '@angular/core';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, BrowserAnimationsModule, HslayersMaterialModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
