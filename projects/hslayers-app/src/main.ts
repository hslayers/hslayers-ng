import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './hslayers-app/hslayers-app.module';
import {environment} from './environments/environment';

if (environment.production) {
  enableProdMode();
}

setTimeout(() => {
  const platform = platformBrowserDynamic();
  const hslayersApps = document.querySelectorAll('hslayers-app');

  hslayersApps.forEach(() => {
    const bootstrap = () => platform.bootstrapModule(AppModule);
    bootstrap().catch((err) => console.log('bootstrap', err));
  });
}, 0);
