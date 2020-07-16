import * as angular from 'angular';
import {StaticProvider} from '@angular/core';
import {
  downgradeComponent,
  downgradeInjectable,
  downgradeModule,
} from '@angular/upgrade/static';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {setAngularJSGlobal} from '@angular/upgrade/static';

setAngularJSGlobal(angular);

export const downgrade = (module) => {
  const ng2BootstrapFn = (extraProviders: StaticProvider[]) => {
    return platformBrowserDynamic(extraProviders).bootstrapModule(module);
  };
  return downgradeModule(ng2BootstrapFn);
};
