import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {HslayersAppComponent} from './hslayers-app.component';
import {HslayersModule} from 'hslayers-ng/core';
import {SomeModule} from './some-panel/some-panel.module';

@NgModule({
  declarations: [HslayersAppComponent],
  imports: [BrowserModule, HslayersModule, SomeModule],
  providers: [],
  bootstrap: [HslayersAppComponent],
})
export class AppModule {
  constructor() {}
}
