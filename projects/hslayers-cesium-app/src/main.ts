import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';

if (environment.production) {
  enableProdMode();
}

setTimeout(() => {
  const platform = platformBrowserDynamic();
  const hslayerCesiumApps = document.querySelectorAll('hslayers-cesium-app');

  hslayerCesiumApps.forEach(() => {
    const bootstrap = () => platform.bootstrapModule(AppModule);
    bootstrap().catch((err) => console.log('bootstrap', err));
  });
}, 0);
