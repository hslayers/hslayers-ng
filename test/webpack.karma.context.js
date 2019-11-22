import angular from 'angular';
import mocks from 'angular-mocks';

import * as main from '../app';

let context = require.context('./', true, /\.spec\.js/);
context.keys().forEach(context);

context = require.context('../components', true, /\.spec\.js/);
context.keys().forEach(context);