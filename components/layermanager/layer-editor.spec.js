/* eslint-disable angular/di */
'use strict';
import VectorLayer from 'ol/layer/Vector';
import {Vector as VectorSource} from 'ol/source';

describe('layermanager', () => {
  let scope;
  let $componentController;

  const layerForCluster = new VectorLayer({
    title: 'Bookmarks',
    source: new VectorSource({}),
  });

  beforeEach(() => {
    angular.mock.module(($provide) => {
      $provide.value('HsConfig', {
        default_layers: [layerForCluster],
      });
    });

    angular.mock.module('hs.layermanager');
  }); //<--- Hook module

  beforeEach(inject((_$componentController_, $rootScope) => {
    scope = $rootScope.$new();
    $componentController = _$componentController_;
  }));

  it('clusterization', () => {
    $componentController(
      'hs.layerEditor',
      {$scope: scope},
      {currentLayer: {layer: layerForCluster}}
    );
    scope.cluster(true);

    expect(layerForCluster.get('cluster')).toBe(true);
    expect(layerForCluster.getSource().getSource).toBeDefined();

    scope.distance.value = 15;
    scope.changeDistance(scope.distance.value);
    expect(layerForCluster.getSource().getDistance()).toBe(15);

    //Turn clusterization off
    scope.cluster(false);
    expect(layerForCluster.get('cluster')).toBe(false);
    expect(layerForCluster.getSource().getSource).toBeUndefined();
  });
});
