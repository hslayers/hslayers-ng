import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HslayersMaterialModule } from 'hslayers-material';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HslayersMaterialModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
