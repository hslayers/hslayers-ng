import {enableProdMode, provideZoneChangeDetection} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {provideHslayers} from 'hslayers-ng/core';

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';

if (environment.production) {
  enableProdMode();
}

setTimeout(() => {
  const bootstrap = () =>
    platformBrowserDynamic().bootstrapModule(AppModule, {
      applicationProviders: [provideZoneChangeDetection(), provideHslayers()],
    });
  bootstrap().catch((err) => console.log(err));
}, 0);
