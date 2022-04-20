import {ApplicationRef, DoBootstrap, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {HsCesiumModule} from 'hslayers-cesium';
import {HslayersModule} from 'hslayers-ng';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HslayersModule, HsCesiumModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule implements DoBootstrap {
  constructor() {}

  ngDoBootstrap(appRef: ApplicationRef) {
    let tries = 0;
    const waitAppElement = () => {
      tries++;
      if (tries > 20) {
        console.error('<hslayers-cesium-app> element is missing!');
        return;
      }
      if (!document.querySelector('hslayers-cesium-app')) {
        setTimeout(waitAppElement, 50);
        return;
      }
      document.querySelectorAll('hslayers-cesium-app').forEach((el) => {
        appRef.bootstrap(AppComponent, el);
      });
    };

    setTimeout(waitAppElement, 50);
  }
}
