import addLayersVectorService from './add-layers-vector.service';


angular.module('hs.addLayersVector', ['hs.styles'])
/**
* @memberof hs.ows
* @ngdoc directive
* @name hs.addLayersVector
* @description TODO
*/
  .directive('hs.addLayersVector', ['config', function (config) {
    return {
      template: require('./add-vector-layer.directive.html')
    };
  }])

/**
* @memberof hs.addLayersVector
* @ngdoc service
* @name hs.addLayersVector.service
* @description Service handling adding nonwms OWS services or files. Handles also drag and drop addition.
*/
  .factory('hs.addLayersVector.service', addLayersVectorService)

/**
* @memberof hs.addLayersVector
* @ngdoc controller
* @name HsAddLayersVectorController
*/
  .controller('HsAddLayersVectorController', ['hs.addLayersVector.service', 'hs.layout.service',
    function (service, layoutService) {
      const vm = this;
      vm.srs = 'EPSG:4326';
      vm.title = '';
      vm.extract_styles = false;


      function getTypeFromUrl(url) {
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.indexOf('geojson') > -1 || lowerUrl.indexOf('geojson') > -1) {
          return 'geojson';
        }
        if (lowerUrl.indexOf('kml') > -1) {
          return 'kml';
        }
        return '';
      }

      /**
        * Handler for adding nonwms service, file in template.
        * @memberof hs.addLayersVector.controller
        * @function add
        */
      vm.add = function () {
        service.add(getTypeFromUrl(vm.url), vm.url, vm.title, vm.abstract, vm.extract_styles, vm.srs);
        layoutService.setMainPanel('layermanager');
      };
    }
  ]);
