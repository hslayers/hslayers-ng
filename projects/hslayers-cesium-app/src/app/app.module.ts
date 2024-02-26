import {ApplicationRef, DoBootstrap, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {HsCesiumModule} from 'hslayers-cesium';
import {HslayersModule} from 'hslayers-ng';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HslayersModule, HsCesiumModule],
  providers: [],
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
      const apps: HTMLElement[] = Array.from(
        document.querySelectorAll(
          'hslayers-cesium-app',
        ) as NodeListOf<HTMLElement>,
      );
      for (const el of apps) {
        if (!el.dataset.init) {
          appRef.bootstrap(AppComponent, el);
          el.dataset.init = 'true';
          return;
        }
      }
    };

    setTimeout(waitAppElement, 50);
  }
}
