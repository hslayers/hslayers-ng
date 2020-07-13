import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import {Fill, Icon, Stroke, Style} from 'ol/style';
import {GeoJSON} from 'ol/format';
import {Modify} from 'ol/interaction';
import {Point} from 'ol/geom';
import {Vector} from 'ol/source';
import {transform} from 'ol/proj';

export const HsTripPlannerController = (
  $scope,
  HsMapService,
  HsCore,
  HsTripPlannerService,
  HsConfig,
  HsLayoutService
) => {
  'ngInject';
  const map = HsMapService.map;
  $scope.loaderImage = HsConfig.hsl_path + 'img/ajax-loader.gif';

  const source = new Vector({});
  const style = function (feature, resolution) {
    return [
      new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.6)',
        }),
        stroke: new Stroke({
          color: '#337AB7',
          width: 3,
        }),
        image: new Icon({
          src: feature.get('highlighted')
            ? HsConfig.hsl_path + 'img/pin_white_red32.png'
            : HsConfig.hsl_path + 'img/pin_white_blue32.png',
          crossOrigin: 'anonymous',
          anchor: [0.5, 1],
        }),
      }),
    ];
  };

  const vector = new VectorLayer({
    source: source,
    style: style,
    title: 'Travel route',
  });

  const movable_features = new Collection();

  const modify = new Modify({
    features: movable_features,
  });

  HsMapService.loaded().then((map) => {
    map.addLayer(vector);
  });

  if (angular.isUndefined(HsConfig.default_layers)) {
    HsConfig.default_layers = [];
  }
  HsConfig.default_layers.push(vector);

  $scope.service = HsTripPlannerService;
  HsTripPlannerService.scopes.push($scope);
  let timer;

  /**
   * Handler of adding waypoint in connected service
   *
   * @memberof HsTripPlannerController
   * @function waypointAdded
   * @param {object} wp Waypoint ojbect, with lat, lon and routes array
   */
  $scope.waypointAdded = function (wp) {
    const f = new Feature({
      geometry: new Point(
        transform(
          [wp.lon, wp.lat],
          'EPSG:4326',
          HsMapService.map.getView().getProjection().getCode()
        )
      ),
      wp: wp,
    });
    wp.feature = f;
    source.addFeature(f);
    movable_features.push(f);
    f.on(
      'change',
      function (e) {
        if (this.get('wp').routes.length > 0) {
          removeRoutesForWaypoint(this.get('wp'));
        }
        const new_cords = transform(
          f.getGeometry().getCoordinates(),
          HsMapService.map.getView().getProjection().getCode(),
          'EPSG:4326'
        );
        this.get('wp').lon = new_cords[0];
        this.get('wp').lat = new_cords[1];
        const prev_index =
          HsTripPlannerService.waypoints.indexOf(this.get('wp')) - 1;
        if (
          prev_index > -1 &&
          HsTripPlannerService.waypoints[prev_index].routes.length > 0
        ) {
          removeRoutesForWaypoint(HsTripPlannerService.waypoints[prev_index]);
        }
        if (timer != null) {
          clearTimeout(timer);
        }
        timer = setTimeout(() => {
          HsTripPlannerService.calculateRoutes();
        }, 500);
      },
      f
    );
  };

  /**
   * (PRIVATE) Remove routes from selected waypoint
   *
   * @memberof HsTripPlannerController
   * @function removeRoutesForWaypoint
   * @param {object} wp Waypoint to remove routes
   */
  function removeRoutesForWaypoint(wp) {
    angular.forEach(wp.routes, (r) => {
      $scope.routeRemoved(r);
    });
    wp.routes = [];
  }

  /**
   * Clear all waypoints from service and layer
   *
   * @memberof HsTripPlannerController
   * @function clearAll
   */
  $scope.clearAll = function () {
    $scope.service.waypoints = [];
    source.clear();
    if (!$scope.$$phase) {
      $scope.$digest();
    }
  };

  HsMapService.map.addInteraction(modify);

  /**
   * Handler of adding computed route to layer
   *
   * @memberof HsTripPlannerController
   * @function routeAdded
   * @param {GeoJSON} feature Route to add
   */
  $scope.routeAdded = function (feature) {
    source.addFeatures(feature);
  };

  /**
   * Remove selected route from source
   *
   * @memberof HsTripPlannerController
   * @function routeRemoved
   * @param {object} feature Route feature to remove
   */
  $scope.routeRemoved = function (feature) {
    try {
      source.removeFeature(feature);
    } catch (ex) {}
  };

  /**
   * Remove selected waypoint from source
   *
   * @memberof HsTripPlannerController
   * @function waypointRemoved
   * @param {object} wp Waypoint feature to remove
   */
  $scope.waypointRemoved = function (wp) {
    try {
      source.removeFeature(wp.feature);
    } catch (ex) {}
  };

  /**
   * Format waypoint route distance in a human friendly way
   *
   * @memberof HsTripPlannerController
   * @function formatDistance
   * @param {float} wp Wayoint
   */
  $scope.formatDistance = function (wp) {
    if (wp.routes.length < 1) {
      return '';
    }
    const distance = wp.routes[0].get('distance');
    if (typeof distance == 'undefined') {
      return '';
    } else {
      return parseFloat(distance).toFixed(2) + 'km';
    }
  };

  /**
   * Get the total distance for all waypoint routes
   *
   * @memberof HsTripPlannerController
   * @function totalDistance
   */
  $scope.totalDistance = function () {
    let tmp = 0;
    angular.forEach($scope.service.waypoints, (wp) => {
      if (wp.routes.length > 0) {
        tmp += parseFloat(wp.routes[0].get('distance'));
      }
    });
    return tmp.toFixed(2) + 'km';
  };

  /**
   * Remove selected waypoint from source
   *
   * @memberof HsTripPlannerController
   * @function toggleEdit
   * @param {object} waypoint
   * @param {unknown} e
   */
  $scope.toggleEdit = function (waypoint, e) {
    waypoint.name_editing = !waypoint.name_editing;
    $scope.service.storeWaypoints();
    waypoint.feature.set('highlighted', waypoint.name_editing);
  };

  $scope.prevPanel = function () {
    HsLayoutService.setMainPanel('info');
  };

  //HsEventBusService.mainPanelChanges.subscribe(() => {});

  $scope.$emit('scope_loaded', 'Trip planner');
};
