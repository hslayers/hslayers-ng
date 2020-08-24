import * as angular from 'angular';
import mocks from 'angular-mocks';

export const runAjsTests = function () {
  let contextAjs = require.context('./', true, /\.spec\.js/);
  contextAjs.keys().forEach(contextAjs);

  contextAjs = require.context('../components', true, /\.spec\.js/);
  contextAjs.keys().forEach(contextAjs);
};
