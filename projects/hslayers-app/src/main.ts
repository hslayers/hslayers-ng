import {enableProdMode, provideZoneChangeDetection} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';

import {provideHslayers} from 'hslayers-ng/core';

import {HslayersAppComponent} from './hslayers-app/hslayers-app.component';
import {environment} from './environments/environment';

if (environment.production) {
  enableProdMode();
}

setTimeout(() => {
  const hslayersApps = document.querySelectorAll('hslayers-app');

  hslayersApps.forEach(() => {
    bootstrapApplication(HslayersAppComponent, {
      providers: [provideZoneChangeDetection(), provideHslayers()],
    }).catch((err) => {
      throw err;
    });
  });
}, 0);
