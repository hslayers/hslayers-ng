/* eslint-disable angular/di */
/* eslint-disable no-undef */
'use strict';
import 'angular-mocks';
import * as angular from 'angular';

describe('add-layers-vector', () => {
  let el, scope, vm;

  beforeEach(() => {
    angular.mock.module(($provide) => {
      $provide.value('HsConfig', {});
    });
    angular.mock.module('hs.addLayersVector', 'hs.map');
  }); //<--- Hook module

  beforeEach(inject(($compile, $rootScope, $injector) => {
    el = angular.element('<hs.add-layers-vector></hs.add-layers-vector>');
    $compile(el)($rootScope.$new());
    $rootScope.$digest();
    scope = el.isolateScope() || el.scope();
    vm = scope.$$childHead.vm;
    $injector.get('HsMapService');
  }));

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
