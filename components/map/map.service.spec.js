'use strict';
import {GeoJSON} from 'ol/format';
import {Tile, Vector as VectorLayer} from 'ol/layer';
import {TileWMS, Vector as VectorSource} from 'ol/source';

describe('map', () => {
  let hsMapService;

  beforeEach(() => {
    angular.mock.module(($provide) => {
      $provide.value('HsConfig', {
        proxyPrefix: '',
        default_layers: [],
      });
    });

    angular.mock.module('hs.map');
  }); //<--- Hook module

  beforeEach(inject(($injector) => {
    hsMapService = $injector.get('HsMapService');
  }));

  it('should compare layers', () => {
    const tileLayer1 = new Tile({
      title: 'Crop stats',
      source: new TileWMS({
        url: 'http://localhost/ows?',
        params: {
          LAYERS: '2017_yield_corn',
          FORMAT: 'image/png',
        },
      }),
      show_in_manager: false,
      visible: true,
    });
    const tileLayer2 = new Tile({
      title: 'Crop stats',
      source: new TileWMS({
        url: 'http://localhost/ows?',
        params: {
          LAYERS: '2017_yield_corn',
          FORMAT: 'image/png',
        },
      }),
      show_in_manager: false,
      visible: true,
    });

    let eq = hsMapService.layersEqual(tileLayer1, tileLayer2);

    expect(eq).toBeDefined();
    expect(eq).toBeTrue();

    const tileLayer3 = new Tile({
      title: 'Maiz stats',
      source: new TileWMS({
        url: 'http://localhost/ows?',
        params: {
          LAYERS: '2019_yield_corn',
          FORMAT: 'image/png',
        },
      }),
      show_in_manager: false,
      visible: true,
    });

    eq = hsMapService.layersEqual(tileLayer1, tileLayer3);

    expect(eq).toBeDefined();
    expect(eq).toBeFalse();

    const vecLayer1 = new VectorLayer({
      title: 'Crop stats',
      source: new VectorSource({
        url: 'http://localhost/ows?',
        format: new GeoJSON(),
      }),
      show_in_manager: false,
      visible: true,
    });

    eq = hsMapService.layersEqual(tileLayer1, vecLayer1);

    expect(eq).toBeDefined();
    expect(eq).toBeFalse();

    const vecLayer2 = new VectorLayer({
      title: 'Crop stats',
      source: new VectorSource({
        url: 'http://localhost/ows?',
        format: new GeoJSON(),
      }),
      show_in_manager: false,
      visible: true,
    });

    eq = hsMapService.layersEqual(vecLayer1, vecLayer2);

    expect(eq).toBeDefined();
    expect(eq).toBeTrue();

    const vecLayer3 = new VectorLayer({
      title: 'Crop stats',
      source: new VectorSource({
        url: 'http://localhost/vector?',
        format: new GeoJSON(),
      }),
      show_in_manager: false,
      visible: true,
    });

    eq = hsMapService.layersEqual(vecLayer1, vecLayer3);

    expect(eq).toBeDefined();
    expect(eq).toBeFalse();
  });
});
