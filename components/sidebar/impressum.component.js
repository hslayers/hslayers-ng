import * as packageJson from '../../package.json';

export default {
  template: require('./partials/impressum.html'),
  controller: function ($scope) {
    'ngInject';
    angular.extend($scope, {
      version: packageJson.version,
      logo: require('../../hslayers-ng-logo.png'),
    });
  },
};
