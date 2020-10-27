/* eslint-disable angular/di */
/* eslint-disable no-undef */
'use strict';
import '../../core/core-ajs.mock';
import 'angular-mocks';
import Map from 'ol/Map';

import * as angular from 'angular';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsStylerService} from '../../styles/styler.service';
import { HsUtilsService } from '../../utils/utils.service';
describe('add-layers-vector', () => {
  let el, scope, vm;

  beforeEach(() => {
    angular.module('hs', []).value('HsConfig', {});

    angular
      .module('hs.utils', ['hs'])
      .service('HsUtilsService', function () {
        this.proxify = function (url) {
          return url;
        };
        this.resolveEsModule = (m) => m;
      })
      .factory('HsLayerUtilsService', HsLayerUtilsService);

    angular.module('hs.map', []).service('HsMapService', function () {
      this.map = new Map({
        target: 'div',
      });
      this.addLayer = function (lyr) {
        this.map.addLayer(lyr);
      };
    });

    angular.module('hs.styles', []).service('HsStylerService', function () {
      this.parseStyle = new HsStylerService(null, <HsUtilsService>{
        resolveEsModule: (m) => {
          return m || m.default;
        },
      }).parseStyle;
    });

    angular
      .module('hs.layout', ['hs.core'])
      .service('HsLayoutService', HsLayoutService);
    angular.module('hs.language', []).service('HsLanguageService', function () {
      this.getTranslation = function () {};
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
