/* eslint-disable prefer-arrow-callback */
/* eslint-disable angular/di */
/* eslint-disable no-undef */
'use strict';
import '../core/core-ajs.mock';
import 'angular-mocks';
import * as angular from 'angular';
import VectorLayer from 'ol/layer/Vector';
import {HsMapService} from './map.service';
import {Vector as VectorSource} from 'ol/source';

describe('hs.map', function () {
  let hsMap;

  beforeEach(function () {
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
    angular.module('hs.language', []).service('HsLanguageService', function () {
      this.getTranslation = function () {};
    });

    angular
      .module('hs.map', [
        'hs',
        'ng',
        'hs.utils',
        'hs.layout',
        'hs.language',
        'hs.core',
      ])
      .service('HsMapService', HsMapService);
    angular.mock.module('hs.map');
  });

  beforeEach(
    angular.mock.inject(($injector) => {
      hsMap = $injector.get('HsMapService');
      hsMap.init();
    })
  );

  it('should create map object', async function () {
    const map = await hsMap.loaded();
    expect(map).toBeDefined();
  });

  it('should not add duplicate layers', async function () {
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
