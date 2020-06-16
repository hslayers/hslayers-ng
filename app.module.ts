import 'reflect-metadata';
import 'core-js/es6/reflect';
import 'core-js/es7/reflect';
import 'zone.js';
import { NgModule, APP_BOOTSTRAP_LISTENER, ComponentRef, ApplicationRef } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';
import app from './ajs-app';
//New rewritten modules:
import { HsPrintModule } from './components/print/print.module';
//Old upgraded (not rewritten) services go here:
import { HsConfigProvider, HsMapServiceProvider, HsUtilsServiceProvider } from './ajs-upgraded-providers';
import { BootstrapComponent } from './bootstrap.component';
import { HsCoreModule } from './components/core';
import { HsLayoutModule } from './components/layout';
@NgModule({
    imports: [
        BrowserModule,
        UpgradeModule,
        HsLayoutModule,
        HsCoreModule
    ],
    declarations: [
        // ... existing declarations       
    ],
    entryComponents: [
        
    ],
    providers: [HsMapServiceProvider, HsConfigProvider, HsUtilsServiceProvider,
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