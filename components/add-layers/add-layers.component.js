export default {
  template: [
    'config',
    (config) => {
      if (config.design == 'md') {
        return require('./partials/add-layers.md.directive.html');
      } else {
        return require('./partials/add-layers.directive.html');
      }
    },
  ],
  controller: [
    '$scope',
    'hs.permalink.urlService',
    'Core',
    'config',
    '$rootScope',
    '$timeout',
    'hs.layout.service',
    'HsDragDropLayerService',
    function (
      $scope,
      permalink,
      Core,
      config,
      $rootScope,
      $timeout,
      layoutService,
      HsDragDropLayerService
    ) {
      $scope.Core = Core;
      if (angular.isArray(config.connectTypes)) {
        $scope.types = config.connectTypes;
      } else {
        $scope.types = [
          {id: 'wms', text: 'Web map service (WMS)'},
          {id: 'arcgis', text: 'ArcGIS Map Server'},
          {id: 'vector', text: 'Vector file (GeoJson, KML)'},
          {id: 'shp', text: 'Shapefile'},
        ];
      }
      $scope.type = '';
      $scope.image_formats = [];
      $scope.query_formats = [];
      $scope.tile_size = 512;

      /**
       * Change detail panel template according to selected type
       * @memberof hs.addLayers
       * @function templateByType
       * @return {String} template Path to correct type template
       */
      $scope.templateByType = function () {
        /**TODO: move variables out of this function. Call $scope.connected = false when template change */
        let template;
        switch ($scope.type.toLowerCase()) {
          case 'wms':
            template = '<hs.add-layers-wms/>';
            break;
          case 'arcgis':
            template = '<hs.add-layers-arcgis/>';
            break;
          case 'wmts':
            template = '<hs.add-layers-wmts/>';
            break;
          case 'wfs':
            template = '<hs.add-layers-wfs/>';
            break;
          case 'vector':
            template = '<hs.add-layers-vector/>';
            $scope.showDetails = true;
            break;
          case 'shp':
            template = '<hs.add-layers-shp/>';
            $scope.showDetails = true;
            break;
          default:
            break;
        }
        return template;
      };

      function connectServiceFromUrlParam(type) {
        if (permalink.getParamValue(`${type}_to_connect`)) {
          const url = permalink.getParamValue(`${type}_to_connect`);
          layoutService.setMainPanel('datasource_selector');
          $scope.type = type.toUpperCase();
          $timeout(() => {
            $rootScope.$broadcast(`ows.${type}_connecting`, url);
          });
        }
      }

      $scope.$on('ows.filling', (event, type, url, layer) => {
        $scope.type = type.toLowerCase();
        $timeout(() => {
          $rootScope.$broadcast(`ows.${type}_connecting`, url, layer);
        });
      });

      connectServiceFromUrlParam('wms');
      connectServiceFromUrlParam('wfs');

      $scope.$emit('scope_loaded', 'Ows');
    },
  ],
};
