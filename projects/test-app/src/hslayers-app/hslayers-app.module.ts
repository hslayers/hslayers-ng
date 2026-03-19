import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {HslayersAppComponent} from './hslayers-app.component';
import {HslayersComponent} from 'hslayers-ng/core';
import {SomeComponent} from './some-panel/some-panel.component';

@NgModule({
  declarations: [HslayersAppComponent],
  imports: [BrowserModule, HslayersComponent, SomeComponent],
  providers: [],
  bootstrap: [HslayersAppComponent],
})
export class AppModule {
  constructor() {}
}
