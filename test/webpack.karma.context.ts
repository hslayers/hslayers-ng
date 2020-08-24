import '../app.module';
import * as angular from 'angular';
import mocks from 'angular-mocks';
import {runAjsTests} from './ajs-tests';
let context = require.context('./', true, /\.spec\.ts/);
context.keys().forEach(context);

context = require.context('../components', true, /\.spec\.ts/);
context.keys().forEach(context);

runAjsTests();
