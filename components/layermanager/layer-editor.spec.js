'use strict';
import VectorLayer from 'ol/layer/Vector';
import { Vector as VectorSource } from 'ol/source';

describe('layermanager', function () {
    var scope;
    var $componentController, scope;

    var layerForCluster = new VectorLayer({
        title: 'Bookmarks',
        source: new VectorSource({})
    })

    beforeEach(function () {
        angular.mock.module(function ($provide) {
            $provide.value('config', {
                default_layers: [layerForCluster]
            });
        });

        angular.mock.module('hs.layermanager')
    }); //<--- Hook module


    beforeEach(inject(function (_$componentController_, $rootScope) {
        scope = $rootScope.$new();
        $componentController = _$componentController_;
    }));

    it('Clusterization', function () {
        var ctrl = $componentController('hs.layerEditor', { $scope: scope }, { currentLayer: { layer: layerForCluster } });
        scope.cluster(true);

        expect(layerForCluster.get('cluster')).toBe(true);
        expect(layerForCluster.getSource().getSource).toBeDefined();

        scope.changeDistance($scope.distance)
    });
});

