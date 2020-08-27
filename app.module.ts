/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import 'core-js/es6/reflect';
import 'core-js/es7/reflect';
import 'reflect-metadata';
import 'zone.js';
import app from './ajs-app';
import {
  APP_BOOTSTRAP_LISTENER,
  ApplicationRef,
  ComponentRef,
  NgModule,
} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {UpgradeModule} from '@angular/upgrade/static';
//New rewritten modules:
//Old upgraded (not rewritten) services go here:
import {BootstrapComponent} from './bootstrap.component';
import {HsCoreModule} from './components/core';

@NgModule({
  imports: [BrowserModule, UpgradeModule, HsCoreModule],
  exports: [],
  declarations: [],
  entryComponents: [],
  providers: [
    {
      provide: APP_BOOTSTRAP_LISTENER,
      multi: true,
      useFactory: () => {
        return (component: ComponentRef<BootstrapComponent>) => {
          component.instance.upgrade.bootstrap(
            document.documentElement,
            [app.name],
            {strictDi: true}
          );
        };
      },
    },
  ],
})
export class AppModule {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
  ngDoBootstrap(appRef: ApplicationRef) {
    appRef.bootstrap(BootstrapComponent);
  }
}
