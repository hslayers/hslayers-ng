// This file is required by karma.conf.js and loads recursively all the .spec and framework files
import '@angular/localize/init';
import 'zone.js/dist/zone';
import 'zone.js/dist/zone-testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {getTestBed} from '@angular/core/testing';

import {patchConsoleToFailOnError} from '../src/testing-utils';

declare const require: {
  context(
    path: string,
    deep?: boolean,
    filter?: RegExp
  ): {
    keys(): string[];
    <T>(id: string): T;
  };
};

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
beforeEach(() => patchConsoleToFailOnError());
// Then we find all the tests.
const context = require.context('../src/', true, /\.spec\.ts$/);
// And load the modules.
context.keys().map(context);
