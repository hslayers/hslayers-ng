/* eslint-disable prefer-arrow-callback */
/* eslint-disable angular/no-service-method */
/* eslint-disable angular/di */
'use strict';
import VectorLayer from 'ol/layer/Vector';
import layerEditorComponent from './layer-editor.component';
import layerEditorDimensionsComponent from './dimensions/layer-editor-dimensions.component';
import layerEditorService from './layer-editor.service';
import layerEditorSubLayerCheckboxesDirective from './layer-editor.sub-layer-checkboxes.directive';
import layerEditorSubLayerService from './layer-editor.sub-layer.service';
import layerEditorVectorLayerService from './layer-editor-vector-layer.service';
import layermanagerMetadataService from './layermanager-metadata.service';
import layermanagerService from './layermanager.service';
import layermanagerWmstService from './layermanager-wmst.service';
import {HsMapService} from '../map/map.service';
import {Subject} from 'rxjs';
import {Vector as VectorSource} from 'ol/source';

describe('layermanager', () => {
  let scope;
  let $componentController;

  const layerForCluster = new VectorLayer({
    title: 'Bookmarks',
    source: new VectorSource({}),
  });

  beforeEach(() => {
    angular.module('hs', []).value('HsConfig', {
      default_layers: [layerForCluster],
    });

    angular
      .module('hs.core', [])
      .service('HsCore', () => { })
      .service('HsEventBusService', function () {
        this.sizeChanges = new Subject();
        this.mapResets = new Subject();
      });


    angular
      .module('hs.styles', ['hs.map'])
      .factory('HsStylesService', () => { })
      .factory('HsStylerService', [
        function () {
          this.layer = null;
          return this;
        },
      ])

    angular.module('hs.map', ['gettext']).service('HsMapService', HsMapService);

    angular
      .module('hs.utils', [])
      .service('HsUtilsService', function () {
        this.debounce = function () {};
      })
      .service('HsLayerUtilsService', function () {});

    angular.module('hs.layout', []).service('HsLayoutService', function () { });

    angular.module('hs.draw', []).service('HsDrawService', function () { });

    angular.module('hs.legend', []).service('HsLegendService', function () { });

    angular
      .module('hs.layermanager', [
        'hs.utils',
        'hs',
        'hs.styles',
        'hs.layout',
        'hs.draw',
        'hs.legend',
      ])
      .factory('HsLayerEditorService', layerEditorService)
      .component('hs.layerEditor', layerEditorComponent)
      .directive(
        'hs.layerEditor.sublayerCheckbox',
        layerEditorSubLayerCheckboxesDirective
      )
      .factory('HsLayermanagerService', layermanagerService)
      .factory('HsLayermanagerWmstService', layermanagerWmstService)
      .factory('HsLayerEditorVectorLayerService', layerEditorVectorLayerService)
      .factory('HsLayerEditorSublayerService', layerEditorSubLayerService)
      .factory('HsLayermanagerMetadata', layermanagerMetadataService)
      .service('HsWmtsGetCapabilitiesService', function () {})
      .service('HsWfsGetCapabilitiesService', function () {})
      .service('HsWmsGetCapabilitiesService', function () {})

      .component('hs.layerEditorDimensions', layerEditorDimensionsComponent);
    angular.mock.module('hs.layermanager');
  });

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
