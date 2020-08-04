import '../../../common/endpoints/endpoints.module';
import '../../save-map/';
import '../../styles/styles.module';
import * as angular from 'angular';
import HsShpController from './shp.controller';
import addLayersShpService from './add-layers-shp.service';
import forShapefileUploadFilter from './for-shapefile-upload.filter';

/**
 * @param config
 * @namespace hs.addLayersShp
 * @memberOf hs
 */
angular
  .module('hs.addLayersShp', [
    'hs.styles',
    'hs.widgets',
    'hs.save-map',
    'hs.addLayersWms',
    'hs.common.endpoints',
  ])
  /**
   * @memberof hs.ows
   * @ngdoc directive
   * @name hs.addLayersShp
   * @description TODO
   */
  .directive('hs.addLayersShp', [
    'HsConfig',
    function (config) {
      return {
        template: require('./add-shp-layer.directive.html'),
      };
    },
  ])

  .directive('fileread', [
    function () {
      return {
        scope: {
          fileread: '=',
        },
        link: function (scope, element, attributes) {
          element.bind('change', (changeEvent) => {
            scope.fileread = [];
            for (let i = 0; i < changeEvent.target.files.length; i++) {
              const file = changeEvent.target.files[i];
              const reader = new FileReader();
              reader.onload = function (loadEvent) {
                scope.$apply(() => {
                  scope.fileread.push({
                    name: file.name,
                    type: file.type,
                    content: loadEvent.target.result,
                  });
                });
              };
              reader.readAsArrayBuffer(file);
            }
          });
        },
      };
    },
  ])

  /**
   * @memberof hs.addLayersShp
   * @ngdoc service
   * @name HsAddLayersShpService
   * @description Service for adding shape files through layman.
   */
  .factory('HsAddLayersShpService', addLayersShpService)

  /**
   * @memberof hs.addLayersShp
   * @ngdoc controller
   * @name HsAddLayersShpController
   */
  .controller('HsAddLayersShpController', HsShpController)

  .filter('forShapeFileUpload', forShapefileUploadFilter);
