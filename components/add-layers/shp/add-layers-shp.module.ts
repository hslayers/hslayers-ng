import '../../../common/endpoints/endpoints.module';
import '../../save-map/';
import '../../styles/styles.module';
import * as angular from 'angular';
import forShapefileUploadFilter from './for-shapefile-upload.filter';
import {HsAddLayersShpComponent} from './add-layers-shp.component';
import {HsAddLayersShpService} from './add-layers-shp.service';

/**
 * @param config
 * @namespace hs.addLayersShp
 * @memberof hs
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
   * @memberof hs.addLayersShp
   * @ngdoc directive
   * @name hs.addLayersShp
   * @description TODO
   */
  .component('hs.addLayersShp', HsAddLayersShpComponent)

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
  .factory('HsAddLayersShpService', HsAddLayersShpService)

  .filter('forShapeFileUpload', forShapefileUploadFilter);
