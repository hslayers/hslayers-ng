import '../../../common/endpoints/endpoints.module';
import '../../save-map/save-map.module';
import '../../styles/styles.module';
import addLayersShpService from './add-layers-shp.service';
import forShapefileUploadFilter from './for-shapefile-upload.filter';

/**
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
  .controller('HsAddLayersShpController', [
    'HsAddLayersShpService',
    'HsLayoutService',
    'HsConfig',
    'HsLaymanService',
    'HsAddLayersWmsAddLayerService',
    '$timeout',
    'HsCommonEndpointsService',
    '$scope',
    function (
      service,
      layoutService,
      config,
      laymanService,
      addLayerService,
      $timeout,
      endpointsService,
      $scope
    ) {
      const vm = this;
      vm.srs = 'EPSG:4326';
      vm.title = '';
      vm.extract_styles = false;
      vm.files = null;
      vm.sld = null;
      vm.errorDetails = {};
      vm.endpoint = null;
      vm.loaderImage = require('../../../img/ajax-loader.gif');

      vm.endpointsService = endpointsService;

      $scope.$watch(
        () => {
          return endpointsService.endpoints;
        },
        (value) => {
          if (value && vm.endpoint === null && value.length > 0) {
            const laymans = value.filter((ep) => ep.type == 'layman');
            if (laymans.length > 0) {
              vm.endpoint = laymans[0];
            } else {
              vm.endpoint = value[0];
            }
            if (vm.endpoint && vm.endpoint.type == 'layman') {
              vm.endpoint.getCurrentUserIfNeeded();
            }
          }
        }
      );

      function describeNewLayer(endpoint, layerName) {
        return new Promise((resolve, reject) => {
          laymanService
            .describeLayer(endpoint, layerName)
            .then((descriptor) => {
              if (
                ['STARTED', 'PENDING', 'SUCCESS'].indexOf(
                  descriptor.wms.status
                ) > -1
              ) {
                $timeout(() => {
                  describeNewLayer(endpoint, layerName).then((response) =>
                    resolve(response)
                  );
                }, 2000);
              } else {
                resolve(descriptor);
              }
            });
        });
      }

      /**
       * Handler for button click to send shape file to layman and wait for
       * answer with wms service url to add to map
       * @memberof HsAddLayersShpController
       * @function add
       */
      vm.add = function () {
        vm.loading = true;
        service
          .add(
            vm.endpoint,
            vm.files,
            vm.name,
            vm.title,
            vm.abstract,
            vm.srs,
            vm.sld
          )
          .then((data) => {
            describeNewLayer(vm.endpoint, vm.name).then((descriptor) => {
              addLayerService.addService(
                descriptor.wms.url,
                undefined,
                vm.name
              );
              vm.loading = false;
              layoutService.setMainPanel('layermanager');
            });
            vm.resultCode = 'success';
          })
          .catch((err) => {
            vm.loading = false;
            vm.resultCode = 'error';
            vm.errorMessage = err.message;
            vm.errorDetails = err.detail;
          });
      };
    },
  ])

  .filter('forShapeFileUpload', forShapefileUploadFilter);
