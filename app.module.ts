import 'reflect-metadata';
import 'core-js/es6/reflect';
import 'core-js/es7/reflect';
import 'zone.js';
import { NgModule, APP_BOOTSTRAP_LISTENER, ComponentRef, ApplicationRef } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';
import app from './ajs-app';
//New rewritten modules:
//Old upgraded (not rewritten) services go here:
import { BootstrapComponent } from './bootstrap.component';
import { HsCoreModule } from './components/core';
@NgModule({
    imports: [
        BrowserModule,
        UpgradeModule,
        HsCoreModule
    ],
    declarations: [],
    entryComponents: [],
    providers: [
        {
            provide: APP_BOOTSTRAP_LISTENER, multi: true, useFactory: () => {
              return (component: ComponentRef<BootstrapComponent>) => {
                component.instance.upgrade.bootstrap(document.documentElement, [app.name], { strictDi: true });
              }
            }
          }]
})
export class AppModule {
    constructor() { }
    ngDoBootstrap(appRef: ApplicationRef) {
        appRef.bootstrap(BootstrapComponent);       
    }
}