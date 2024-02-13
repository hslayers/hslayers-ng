import {ApplicationRef, DoBootstrap, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';

import {HsLayoutModule} from 'hslayers-ng/components/layout';
import {HslayersAppComponent} from './hslayers-app.component';

@NgModule({
  declarations: [HslayersAppComponent],
  imports: [BrowserModule, HttpClientModule, HsLayoutModule],
  providers: [],
})
export class AppModule implements DoBootstrap {
  constructor() {}

  ngDoBootstrap(appRef: ApplicationRef) {
    let tries = 0;
    const waitAppElement = () => {
      tries++;
      if (tries > 20) {
        console.error('<hslayers-app> element is missing!');
        return;
      }
      if (!document.querySelector('hslayers-app')) {
        setTimeout(waitAppElement, 50);
        return;
      }
      const apps: HTMLElement[] = Array.from(
        document.querySelectorAll('hslayers-app'),
      );
      for (const el of apps) {
        if (!el.dataset.init) {
          appRef.bootstrap(HslayersAppComponent, el);
          el.dataset.init = 'true';
          return;
        }
      }
    };

    setTimeout(waitAppElement, 50);
  }
}
