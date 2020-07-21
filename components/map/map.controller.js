import {transform} from 'ol/proj';

/**
 * @param $scope
 * @param HsMapService
 * @param HsConfig
 * @param HsPermalinkUrlService
 * @param HsCore
 * @param $rootScope
 * @param $compile
 * @param $timeout
 * @param HsLayoutService
 */
export default function (
  $scope,
  HsMapService,
  HsConfig,
  HsPermalinkUrlService,
  HsCore,
  $rootScope,
  $compile,
  HsLayoutService,
  HsEventBusService
) {
  'ngInject';
  angular.extend($scope, {
    layoutService: HsLayoutService,
    /**
     * @ngdoc method
     * @name HsMapController#setTargetDiv
     * @public
     * @description Sets div element of the map
     * @param {string} div ID of the container element or element itself
     */
    setTargetDiv(div) {
      HsMapService.map.setTarget(div);
    },

    /**
     * @ngdoc method
     * @name HsMapController#findLayerByTitle
     * @public
     * @param {string} title Title of the layer (from layer creation)
     * @returns {Ol.layer} Ol.layer object
     * @description Find layer object by title of layer
     */
    findLayerByTitle: HsMapService.findLayerByTitle,

    /**
     * @ngdoc method
     * @name HsMapController#init
     * @public
     * @description Initialization of map object, initialize map and
     * map state from permalink.
     */
    init() {
      if (HsPermalinkUrlService.getParamValue('visible_layers')) {
        HsMapService.visibleLayersInUrl = HsPermalinkUrlService.getParamValue(
          'visible_layers'
        ).split(';');
      }
      HsMapService.init();
      const hs_x = HsPermalinkUrlService.getParamValue('hs_x');
      const hs_y = HsPermalinkUrlService.getParamValue('hs_y');
      const hs_z = HsPermalinkUrlService.getParamValue('hs_z');
      if (
        hs_x &&
        hs_x != 'NaN' &&
        hs_y &&
        hs_y != 'NaN' &&
        hs_z &&
        hs_z != 'NaN'
      ) {
        HsMapService.moveToAndZoom(
          parseFloat(hs_x),
          parseFloat(hs_y),
          parseInt(hs_z)
        );
      }

      if (
        HsPermalinkUrlService.getParamValue('puremap') ||
        HsConfig.pureMap == true
      ) {
        HsCore.puremapApp = true;
        HsConfig.mapInteractionsEnabled = false;
        HsCore.createComponentsEnabledConfigIfNeeded();
        HsConfig.componentsEnabled.mapControls = false;
        HsConfig.componentsEnabled.geolocationButton = false;
        HsConfig.componentsEnabled.defaultViewButton = false;
        if (HsMapService.puremap) {
          HsMapService.puremap();
        }
      }
      const defaultViewElement = HsLayoutService.contentWrapper.querySelector(
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
   * @param {Array} data Coordinates in lon/lat and resolution
   * @description This gets called from Cesium map, to
   * synchronize center and resolution between Ol and Cesium maps
   */
  function onCenterSync(data) {
    const center = data.center;
    if (angular.isUndefined(center) || center === null) {
      return;
    }
    const toProj = HsMapService.map.getView().getProjection();
    const transformed = transform([center[0], center[1]], 'EPSG:4326', toProj);
    HsMapService.moveToAndZoom(
      transformed[0],
      transformed[1],
      zoomForResolution(center[2])
    );
  }

  const unregisterMapSyncCenterHandler = HsEventBusService.mapCenterSynchronizations.subscribe(
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
   * @returns {number} Zoom level for resolution. If resolution
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
}
