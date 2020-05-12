'use strict';
import {Image as ImageLayer, Tile, Vector as VectorLayer} from 'ol/layer';
import {OSM, TileWMS} from 'ol/source';

describe('legend', () => {
  let scope;
  let $componentController;

  beforeEach(() => {
    angular.mock.module(($provide) => {
      $provide.value('config', {
        proxyPrefix: '',
        default_layers: [],
      });
    });

    angular.mock.module('hs.legend');
  }); //<--- Hook module

  beforeEach(inject((_$componentController_, $rootScope) => {
    scope = $rootScope.$new();
    $componentController = _$componentController_;
  }));

  it('should generate descriptor', () => {
    const layer = new Tile({
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
    const ctrl = $componentController('hs.legend', {$scope: scope}, {});

    scope.addLayerToLegends(layer);

    expect(scope.layerDescriptors.length).toBeDefined();

    expect(scope.layerDescriptors[0].type).toBe('wms');
    expect(scope.layerDescriptors[0].title).toBe('Crop stats');
    expect(scope.layerDescriptors[0].subLayerLegends).toEqual([
      'http://localhost/ows?&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=2017_yield_corn&format=image%2Fpng',
    ]);
  });

  it('should follow wms source LAYERS change', () => {
    const layer = new Tile({
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
    const ctrl = $componentController('hs.legend', {$scope: scope}, {});
    scope.addLayerToLegends(layer);
    const layerParams = layer.getSource().getParams();
    layerParams.LAYERS = `2017_damage_tomato`;
    layer.getSource().updateParams(layerParams);
    expect(scope.layerDescriptors[0].subLayerLegends).toEqual([
      'http://localhost/ows?&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=2017_damage_tomato&format=image%2Fpng',
    ]);
  });
});
