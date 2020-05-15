import {transform} from 'ol/proj';

export default [
  '$scope',
  'HsMapService',
  'HsConfig',
  'HsPermalinkUrlService',
  'HsCore',
  '$rootScope',
  '$compile',
  '$timeout',
  'HsLayoutService',
  function (
    $scope,
    OlMap,
    config,
    permalink,
    HsCore,
    $rootScope,
    $compile,
    $timeout,
    layoutService
  ) {
    angular.extend($scope, {
      layoutService,
      /**
       * @ngdoc method
       * @name HsMapController#setTargetDiv
       * @public
       * @description Sets div element of the map
       * @param {string} div ID of the container element or element itself
       */
      setTargetDiv(div) {
        OlMap.map.setTarget(div);
      },

      /**
       * @ngdoc method
       * @name HsMapController#findLayerByTitle
       * @public
       * @param {string} title Title of the layer (from layer creation)
       * @returns {Ol.layer} Ol.layer object
       * @description Find layer object by title of layer
       */
      findLayerByTitle: OlMap.findLayerByTitle,

      /**
       * @ngdoc method
       * @name HsMapController#init
       * @public
       * @description Initialization of map object, initialize map and
       * map state from permalink.
       */
      init() {
        if (permalink.getParamValue('visible_layers')) {
          OlMap.visible_layers = permalink
            .getParamValue('visible_layers')
            .split(';');
        }
        OlMap.init();
        const hs_x = permalink.getParamValue('hs_x');
        const hs_y = permalink.getParamValue('hs_y');
        const hs_z = permalink.getParamValue('hs_z');
        if (
          hs_x &&
          hs_x != 'NaN' &&
          hs_y &&
          hs_y != 'NaN' &&
          hs_z &&
          hs_z != 'NaN'
        ) {
          OlMap.moveToAndZoom(
            parseFloat(hs_x),
            parseFloat(hs_y),
            parseInt(hs_z)
          );
        }

        if (permalink.getParamValue('puremap') || config.pureMap == true) {
          HsCore.puremapApp = true;
          config.mapInteractionsEnabled = false;
          HsCore.createComponentsEnabledConfigIfNeeded();
          config.componentsEnabled.mapControls = false;
          config.componentsEnabled.geolocationButton = false;
          config.componentsEnabled.defaultViewButton = false;
          if (OlMap.puremap) {
            OlMap.puremap();
          }
        }
        const defaultViewElement = layoutService.contentWrapper.querySelector(
          '.hs-defaultView'
        );
        $compile(defaultViewElement, $scope);
      },
    });

    /**
     * @ngdoc method
     * @name HsMapController#onCenterSync
     * @private
     * @param {event} event Info about angularjs broadcasted event
     * @param {array} data Coordinates in lon/lat and resolution
     * @description This gets called from Cesium map, to
     * synchronize center and resolution between Ol and Cesium maps
     */
    function onCenterSync(event, data) {
      if (angular.isUndefined(data) || data === null) {
        return;
      }
      const toProj = OlMap.map.getView().getProjection();
      const transformed = transform([data[0], data[1]], 'EPSG:4326', toProj);
      OlMap.moveToAndZoom(
        transformed[0],
        transformed[1],
        zoomForResolution(data[2])
      );
    }

    const unregisterMapSyncCenterHandler = $rootScope.$on(
      'map.sync_center',
      onCenterSync
    );
    $scope.$on('$destroy', () => {
      if (unregisterMapSyncCenterHandler) {
        unregisterMapSyncCenterHandler();
      }
    });

    /**
     * @ngdoc method
     * @name HsMapController#zoomForResolution
     * @private
     * @param {number} resolution Resolution
     * @description Calculates zoom level for a given resolution
     * @returns {Number} Zoom level for resolution. If resolution
     * was greater than 156543.03390625 return 0
     */
    function zoomForResolution(resolution) {
      let zoom = 0;
      //Sometimes resolution is under 0. Ratis
      resolution = Math.abs(resolution);
      let r = 156543.03390625; // resolution for zoom 0
      while (resolution < r) {
        r /= 2.0;
        zoom++;
        if (resolution > r) {
          return zoom;
        }
      }
      return zoom; // resolution was greater than 156543.03390625 so return 0
    }

    $scope.$emit('scope_loaded', 'Map');
  },
];
