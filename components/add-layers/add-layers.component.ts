export const HsAddLayersComponent = {
  template: (HsConfig) => {
    'ngInject';
    if (HsConfig.design == 'md') {
      return require('./partials/add-layers.md.directive.html');
    } else {
      return require('./partials/add-layers.directive.html');
    }
  },
  controller: function (
    $scope,
    HsPermalinkUrlService,
    HsCore,
    HsConfig,
    $rootScope,
    $timeout,
    HsLayoutService,
    HsEventBusService
  ) {
    'ngInject';
    $scope.HsCore = HsCore;
    if (angular.isArray(HsConfig.connectTypes)) {
      $scope.types = HsConfig.connectTypes;
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
     *
     * @memberof hs.addLayers
     * @function templateByType
     * @returns {string} template Path to correct type template
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

    /**
     * @param type
     */
    function connectServiceFromUrlParam(type) {
      if (HsPermalinkUrlService.getParamValue(`${type}_to_connect`)) {
        const url = HsPermalinkUrlService.getParamValue(`${type}_to_connect`);
        HsLayoutService.setMainPanel('datasource_selector');
        $scope.type = type.toUpperCase();
        $timeout(() => {
          if (type == 'wms') {
            HsEventBusService.owsConnecting.next({type: 'WMS', uri: url});
          } else {
            $rootScope.$broadcast(`ows.${type}_connecting`, url);
          }
        });
      }
    }

    HsEventBusService.owsFilling.subscribe(({type, uri, layer}) => {
      $scope.type = type.toLowerCase();
      $timeout(() => {
        if (type == 'wms') {
          HsEventBusService.owsConnecting.next({type: 'WMS', uri, layer});
        } else {
          $rootScope.$broadcast(`ows.${type}_connecting`, uri, layer);
        }
      });
    });

    connectServiceFromUrlParam('wms');
    connectServiceFromUrlParam('wfs');

    $scope.$emit('scope_loaded', 'Ows');
  },
};

export default HsAddLayersComponent;
