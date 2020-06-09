import 'reflect-metadata';
import 'core-js/es6/reflect';
import 'core-js/es7/reflect';
import 'zone.js';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';
import app from './ajs-app';
//New rewritten modules:
import { HsPrintModule } from './components/print/print.module';
//Old upgraded (not rewritten) services go here:
import { HsConfigProvider, HsMapServiceProvider } from './ajs-upgraded-providers';
@NgModule({
    imports: [
        BrowserModule,
        UpgradeModule,
        HsPrintModule
    ],
    declarations: [
        // ... existing declarations       
    ],
    entryComponents: [
        
    ],
    providers: [HsMapServiceProvider, HsConfigProvider]
})
export class AppModule {
    constructor(private upgrade: UpgradeModule) { }
    ngDoBootstrap() {
        //app.name should be same as module name and directive name: 'hs'
        this.upgrade.bootstrap(document.documentElement, [app.name], { strictDi: true });
    }
}