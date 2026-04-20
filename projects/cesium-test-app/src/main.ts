import {enableProdMode, provideZoneChangeDetection} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';

import {provideHslayers} from 'hslayers-ng/core';

import {AppComponent} from './app/app.component';
import {environment} from './environments/environment';

if (environment.production) {
  enableProdMode();
}

setTimeout(() => {
  /**
   * To bootstrap multiple apps (multiple root components) from one `main.ts`
   * with isolated root injectors, call `bootstrapApplication(...)` separately
   * for each root component.
   *
   * Each call creates its own environment/root injector. This is the standalone
   * equivalent of "bootstrap each module separately" from the NgModule era.
   */
  bootstrapApplication(AppComponent, {
    providers: [provideZoneChangeDetection(), provideHslayers()],
  }).catch((err) => {
    throw err;
  });
}, 0);
