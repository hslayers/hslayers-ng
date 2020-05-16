'use strict';
import 'add-layers.module';
import 'angular-material';
import 'datasource-selector.module';
import 'info.module';
import 'measure.module';
import 'permalink.module';
import 'print.module';
import 'query.module';
import 'search.module';
import 'sidebar.module';
import 'toolbar.module';

const mainModuleMd = angular.module('hs', [
  'hs.sidebar',
  'hs.toolbar',
  'hs.layermanager',
  'hs.map',
  'hs.query',
  'hs.search',
  'hs.print',
  'hs.permalink',
  'hs.measure',
  'hs.legend',
  'hs.geolocation',
  'hs.core',
  'hs.datasource_selector',
  'hs.save-map',
  'hs.addLayers',
  'gettext',
  'hs.compositions',
  'hs.info',
]);

mainModuleMd.directive('hs', (HsCore) => {
  'ngInject';
  return {
    template: require('hslayers.html'),
    link: function (scope, element, attrs) {
      HsCore.fullScreenMap(element);
    },
  };
});

if (window.hslayersNgConfig) {
  mainModuleMd.value(
    'HsConfig',
    Object.assign({}, window.hslayersNgConfig(ol))
  );
}

mainModuleMd.controller('Main', ($scope, HsCore, HsLayoutService) => {
  'ngInject';
  $scope.HsCore = HsCore;
  HsLayoutService.sidebarRight = false;
});
