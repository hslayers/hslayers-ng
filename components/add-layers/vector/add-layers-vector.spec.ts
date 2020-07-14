/* eslint-disable angular/di */
/* eslint-disable no-undef */
'use strict';
import 'angular-mocks';
import * as angular from 'angular';
import HsLayerUtilsService from '../../utils/layer-utils.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsMapService} from '../../map/map.service';
import {HsUtilsService} from '../../utils/utils.service';
describe('add-layers-vector', () => {
  let el, scope, vm;

  beforeEach(() => {
    angular.module('hs', []).value('HsConfig', {});

    angular
      .module('hs.utils', ['hs'])
      .service('HsUtilsService', HsUtilsService)
      .factory('HsLayerUtilsService', HsLayerUtilsService);

    angular.module('hs.map', []).service('HsMapService', HsMapService);

    angular.module('hs.layout', []).service('HsLayoutService', HsLayoutService);

    angular.module('gettext').filter('translate', function (gettextCatalog) {
      function filter(input, context) {
        return gettextCatalog.getString(input, null, context);
      }
      filter.$stateful = true;
      return filter;
    });

    angular.mock.module('hs.addLayersVector');
  });

  beforeEach(
    angular.mock.inject(($compile, $rootScope, $injector) => {
      el = angular.element('<hs.add-layers-vector></hs.add-layers-vector>');
      $compile(el)($rootScope.$new());
      $rootScope.$digest();
      scope = el.isolateScope() || el.scope();
      vm = scope.$$childHead.vm;
      $injector.get('HsMapService');
    })
  );

  it('GeoJSON layer should be added', async () => {
    vm.url =
      'http://data-lakecountyil.opendata.arcgis.com/datasets/cd63911cc52841f38b289aeeeff0f300_1.geojson';
    vm.title = 'Cancer rates';
    vm.abstract =
      'Lake County, Illinois — Layers in this service includes: Birth, ';
    vm.srs = '';
    vm.extract_styles = false;

    const layer = await vm.add();
    expect(layer).toBeDefined();
    expect(layer.get('title')).toEqual('Cancer rates');
  });
});
