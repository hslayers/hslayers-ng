/* eslint-disable angular/di */
/* eslint-disable no-undef */
'use strict';
import 'angular-mocks';
import * as angular from 'angular';
import VectorLayer from 'ol/layer/Vector';
import {HsMapService} from './map.service';
import {Vector as VectorSource} from 'ol/source';

describe('hs.map', () => {
  let hsMap;

  beforeEach(() => {
    /* Mocks start ===== */
    angular
      .module('hs.utils', [])
      .service('HsUtilsService', function () {
        this.debounce = function () {};
        this.instOf = function (a, b) {
          return false;
        };
      })
      .service('HsLayerUtilsService', function () {});

    angular.module('hs.layout', []).service('HsLayoutService', function () {});

    angular.module('gettext').filter('translate', function (gettextCatalog) {
      function filter(input, context) {
        return gettextCatalog.getString(input, null, context);
      }
      filter.$stateful = true;
      return filter;
    });
    /* Mocks end ===== */
    angular
      .module('hs.map', ['hs', 'ng', 'hs.utils', 'hs.layout', 'gettext'])
      .service('HsMapService', HsMapService);
    angular.mock.module('hs.map');
  });

  beforeEach(
    angular.mock.inject(($injector) => {
      hsMap = $injector.get('HsMapService');
      hsMap.init();
    })
  );

  it('should create map object', async () => {
    const map = await hsMap.loaded();
    expect(map).toBeDefined();
  });

  it('should not add duplicate layers', async () => {
    await hsMap.loaded();
    const layer1 = new VectorLayer({
      title: 'Bookmarks',
      source: new VectorSource({}),
    });
    hsMap.map.addLayer(layer1);

    const layer2 = new VectorLayer({
      title: 'Bookmarks',
      source: new VectorSource({}),
    });
    const exists = hsMap.layerAlreadyExists(layer2);
    expect(exists).toBe(true);
  });
});
