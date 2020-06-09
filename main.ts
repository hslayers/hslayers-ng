import 'reflect-metadata';
import 'core-js/es7/reflect';
import 'core-js/es6/reflect';
import { AppModule } from './app.module';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { setAngularJSGlobal } from '@angular/upgrade/static';
import * as angular from 'angular';
import 'zone.js';

setAngularJSGlobal(angular);
platformBrowserDynamic().bootstrapModule(AppModule);