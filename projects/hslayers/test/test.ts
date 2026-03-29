// This file is required by karma.conf.js and loads recursively all the .spec and framework files
import 'zone.js/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';
import {getTestBed} from '@angular/core/testing';

import {patchConsoleToFailOnError} from './testing-utils';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting(),
  {
    teardown: {destroyAfterEach: false},
  },
);
beforeEach(() => patchConsoleToFailOnError());
