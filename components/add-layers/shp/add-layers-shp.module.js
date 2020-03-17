import '../../styles/styles.module';
import '../../save-map/save-map.module';
import addLayersShpService from './add-layers-shp.service';

/**
 * @namespace hs.addLayersShp
 * @memberOf hs
 */
angular.module('hs.addLayersShp', ['hs.styles', 'hs.widgets', 'hs.save-map', 'hs.addLayersWms'])
/**
    * @memberof hs.ows
    * @ngdoc directive
    * @name hs.addLayersShp
    * @description TODO
    */
  .directive('hs.addLayersShp', ['config', function (config) {
    return {
      template: require('./add-shp-layer.directive.html')
    };
  }])

  .directive('fileread', [function () {
    return {
      scope: {
        fileread: '='
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
                  content: loadEvent.target.result
                });
              });
            };
            reader.readAsArrayBuffer(file);
          }

        });
      }
    };
  }])

/**
    * @memberof hs.addLayersShp
    * @ngdoc service
    * @name hs.addLayersShp.service
    * @description Service for adding shapefiles through layman.
    */
  .factory('hs.addLayersShp.service', addLayersShpService)

/**
    * @memberof hs.addLayersShp
    * @ngdoc controller
    * @name HsAddLayersShpController
    */
  .controller('HsAddLayersShpController', ['hs.addLayersShp.service', 'hs.layout.service', 'config', 'hs.laymanService', 'hs.addLayersWms.addLayerService', '$timeout',
    function (service, layoutService, config, laymanService, addLayerService, $timeout) {
      const vm = this;
      vm.srs = 'EPSG:4326';
      vm.title = '';
      vm.extract_styles = false;
      vm.files = null;
      vm.sld = null;
      vm.errorDetails = {};
      vm.loaderImage = require('../../../img/ajax-loader.gif');

      vm.endpoints = (config.datasources || []).filter(ds => ds.type == 'layman').map(
        ds => {
          return {
            type: 'layman',
            name: 'Layman',
            url: ds.url,
            user: ds.user
          };
        });

      if (vm.endpoints.length > 0) {
        vm.endpoint = vm.endpoints[0];
      }

      function describeNewLayer(endpoint, layerName) {
        return new Promise((resolve, reject) => {
          laymanService.describeLayer(endpoint, layerName)
            .then(descriptor => {
              if (['STARTED', 'PENDING', 'SUCCESS'].indexOf(descriptor.wms.status) > -1) {
                $timeout(() => {
                  describeNewLayer(endpoint, layerName)
                    .then(response => resolve(response));
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
        service.add(vm.endpoint, vm.files, vm.name, vm.title, vm.abstract, vm.srs, vm.sld).then(data => {
          describeNewLayer(vm.endpoint, vm.name)
            .then(descriptor => {
              addLayerService.addService(descriptor.wms.url, undefined, vm.name);
              vm.loading = false;
              layoutService.setMainPanel('layermanager');
            });
          vm.resultCode = 'success';
        }).catch(err => {
          vm.loading = false;
          vm.resultCode = 'error';
          vm.errorMessage = err.message;
          vm.errorDetails = err.detail;
        });
      };
    }
  ]);
