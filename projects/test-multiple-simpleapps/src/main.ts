import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from '../src/hslayers-app/hslayers-app.module';
import {environment} from './environments/environment';

if (environment.production) {
  enableProdMode();
}

setTimeout(() => {
  const platform = platformBrowserDynamic();
  const hslayerApps = document.querySelectorAll('hslayers-app');

  hslayerApps.forEach(() => {
    const bootstrap = () => platform.bootstrapModule(AppModule);
    bootstrap().catch((err) => console.log('bootstrap', err));
  });
}, 0);
