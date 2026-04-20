import {enableProdMode, provideZoneChangeDetection} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';

import {provideHslayers} from 'hslayers-ng/core';

import {AppComponent} from './app/app.component';
import {environment} from './environments/environment';

if (environment.production) {
  enableProdMode();
}

setTimeout(() => {
  const hslayersCesiumApps = document.querySelectorAll('hslayers-cesium-app');

  hslayersCesiumApps.forEach(() => {
    bootstrapApplication(AppComponent, {
      providers: [provideZoneChangeDetection(), provideHslayers()],
    }).catch((err) => {
      console.error('bootstrap', err);
    });
  });
}, 0);
