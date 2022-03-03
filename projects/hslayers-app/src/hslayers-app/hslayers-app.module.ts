import {ApplicationRef, DoBootstrap, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {HslayersAppComponent} from './hslayers-app.component';
import {HslayersModule} from '../../../hslayers/src/public-api';

@NgModule({
  declarations: [HslayersAppComponent],
  imports: [BrowserModule, HslayersModule],
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
      document.querySelectorAll('hslayers-app').forEach((el) => {
        appRef.bootstrap(HslayersAppComponent, el);
      });
    };

    setTimeout(waitAppElement, 50);
  }
}
