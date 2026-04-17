import {enableProdMode, provideZoneChangeDetection} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {provideHslayers} from 'hslayers-ng/core';

import {AppModule} from '../src/hslayers-app/hslayers-app.module';
import {environment} from './environments/environment';

if (environment.production) {
  enableProdMode();
}

setTimeout(() => {
  /**
   * To bootstrap multiple apps save platform to const
   *   - const platform = platformBrowserDynamic();
   * Bootstrap each module separately
   *   - platform.bootstrapModule(<my-module>);
   * they'll each have separate root injector
   */
  const bootstrap = () =>
    platformBrowserDynamic().bootstrapModule(AppModule, {
      applicationProviders: [provideZoneChangeDetection(), provideHslayers()],
    });
  bootstrap().catch((err) => console.log(err));
}, 0);
