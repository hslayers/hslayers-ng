import {enableProdMode, provideZoneChangeDetection} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';

import {provideHslayers} from 'hslayers-ng/core';

import {HslayersAppComponent} from './hslayers-app/hslayers-app.component';
import {environment} from './environments/environment';

if (environment.production) {
  enableProdMode();
}

setTimeout(() => {
  /**
   * To bootstrap multiple apps (multiple root components) from one main file
   * with isolated root injectors, call `bootstrapApplication(...)` separately
   * for each root component.
   *
   * Each call creates its own environment/root injector. This is the standalone
   * equivalent of "bootstrap each module separately" from the NgModule era.
   */
  bootstrapApplication(HslayersAppComponent, {
    providers: [provideZoneChangeDetection(), provideHslayers()],
  }).catch((err) => {
    console.error('bootstrap', err);
  });
}, 0);
