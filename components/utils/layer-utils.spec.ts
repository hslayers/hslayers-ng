/* eslint-disable angular/di */
'use strict';
import * as angular from 'angular';
import 'angular-mocks';
import Vector from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {HsUtilsService} from './utils.service';
import hsLayerUtilsService from './layer-utils.service';

describe('layer-utils', () => {
  let hsLayerUtils;
  
  

  beforeEach(function(){
    angular.module('hs', []).value('HsConfig', {
    }).provider({
      $rootElement:function() {
         this.$get = function() {
           return angular.element('<div ng-app></div>');
        };
      }
    });
  
    angular.module('hs.utils', ['hs', 'ng'])
    .service('HsUtilsService', HsUtilsService)
    .factory('HsLayerUtilsService', hsLayerUtilsService);
    angular.mock.module('hs.utils');
  })

  beforeEach(function (){
    var $injector = angular.injector([ 'hs.utils' ]);
    hsLayerUtils = $injector.get( 'HsLayerUtilsService' );
  });

  it('check if layer is clustered', function() {
    const clusteredLayer = new VectorLayer({
      title: 'villages',
      source: new Vector(),
      cluster: true,
    });
    const unclusteredLayer = new VectorLayer({
      title: 'cities',
      source: new Vector(),
    });
    let isClustered = hsLayerUtils.isLayerClustered(clusteredLayer);
    expect(isClustered).toBe(true);
    isClustered = hsLayerUtils.isLayerClustered(unclusteredLayer);
    expect(isClustered).toBe(false);
  });
});
