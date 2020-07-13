import Feature from 'ol/Feature';
import {Circle, Fill, Stroke, Style} from 'ol/style';
import {GeoJSON} from 'ol/format';
import {Point} from 'ol/geom';
import {Vector} from 'ol/source';
import {transform} from 'ol/proj';
/**
 * @param $scope
 * @param HsMapService
 * @param HsLayoutService
 * @param HsEventBusService
 */
export const HsRoutingController = function (
  $scope,
  HsMapService,
  HsLayoutService,
  HsEventBusService
) {
  'ngInject';
  // Set the instance of the OpenAPI that s4a.js
  // works towards
  //s4a.openApiUrl('http://localhost:8080/openapi');

  // Set an alias for the namepath to the Routing
  // module
  const Routing = s4a.analytics.Routing;

  // Assign the OpenLayers map object to a local variable
  const map = HsMapService.map;

  // Declare a variable to control the click listener
  // for adding and removing it smoothly
  let singleClickListener;

  // Define the source of a vector layer to hold
  // routing calculataed features
  const gjSrc = new Vector();

  // Define a format reader to parse WKT to OpenLayers features
  const gjFormat = new GeoJSON();

  // Define the style to apply to the routing feature
  // layer
  const gjStyle = new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)',
    }),
    stroke: new Stroke({
      color: '#ff0000',
      width: 3,
    }),
    image: new Circle({
      radius: 5,
      fill: new Fill({
        color: '#ff0000',
      }),
    }),
  });

  // Create a re-usable vector layer with the specific
  // source and style
  const gjLyr = new Vector({
    source: gjSrc,
    style: gjStyle,
  });

  /**
   * (PRIVATE) Utility function to transform forward/inverse between 4326 - 3857
   *
   * @memberof HsRoutingController
   * @function trans
   * @param {ol.coordinate} coordinate Coordinate to transform
   * @param {boolean} inverse Direction of transformation (true = 3857 -> 4326, false = 4326 -> 3857)
   * @returns {ol.coordinate} p Transformated coordinate
   */
  const trans = function (coordinate, inverse) {
    let p = null;
    if (inverse === true) {
      p = transform(coordinate, 'EPSG:3857', 'EPSG:4326');
    } else {
      p = transform(coordinate, 'EPSG:4326', 'EPSG:3857');
    }
    return p;
  };

  // Name of the currently selected operation
  $scope.operation = '';

  // Default values for reachable area calculations
  $scope.reachableArea = {
    distance: '5000',
  };

  $scope.optimalRoute = {
    isLoop: true,
  };

  /**
   * Set the default operation (Shortest route)
   *
   * @memberof HsRoutingController
   * @function setDefaultOperation
   */
  const setDefaultOperation = function () {
    $scope.operation = 'ShortestRoute';
  };

  // Array to hold search results
  $scope.searchResults = [];

  // Array to hold way points
  $scope.wayPoints = [];

  /**
   * Set routing operation and remove previous results and waypoints
   *
   * @memberof HsRoutingController
   * @function setOperation
   * @param {string} operation Selected operation
   */
  $scope.setOperation = function (operation) {
    $scope.clearAll();
    $scope.clearWayPoints();
    $scope.clearSearchResults();
    $scope.operation = operation;
    if (!$scope.$$phase) {
      $scope.$digest();
    }
  };

  /**
   * Clear route's vector source
   *
   * @memberof HsRoutingController
   * @function clearAll
   */
  $scope.clearAll = function () {
    setDefaultOperation();
    gjSrc.clear();
  };

  /**
   * Clear drawn waypoints
   *
   * @memberof HsRoutingController
   * @function clearWayPoints
   */
  $scope.clearWayPoints = function () {
    $scope.wayPoints.length = 0;
    gjSrc.clear();
    if (!$scope.$$phase) {
      $scope.$digest();
    }
  };

  /**
   * Clear current search results
   *
   * @memberof HsRoutingController
   * @function clearSearchResults
   */
  $scope.clearSearchResults = function () {
    $scope.searchResults.length = 0;
  };

  /**
   * (PRIVATE) Click handler for clicks, call handler by operation
   *
   * @memberof HsRoutingController
   * @function clickHandler
   * @param {ol.click.event} evt
   */
  const clickHandler = function (evt) {
    if ($scope.operation === 'ShortestRoute') {
      shortestRouteClickHandler(evt);
    } else if ($scope.operation === 'ReachableArea') {
      reachableAreaClickHandler(evt);
    } else if ($scope.operation === 'OptimalRoute') {
      optimalRouteClickHandler(evt);
    }
  };

  /**
   * (PRIVATE) Handler to be invoked when the shortest route operation is activated
   *
   * @memberof HsRoutingController
   * @function shortestRouteClickHandler
   * @param {ol.ClickEvent} evt
   */
  var shortestRouteClickHandler = function (evt) {
    // Reset if two or more way points
    if ($scope.wayPoints.length >= 2) {
      $scope.clearWayPoints();
    }
    addWayPoint(evt.coordinate);
  };

  /**
   * (PRIVATE) Handler to be invoked when the optimal route operation is activated
   *
   * @memberof HsRoutingController
   * @function optimalRouteClickHandler
   * @param {ol.ClickEvent} evt
   */
  var optimalRouteClickHandler = function (evt) {
    addWayPoint(evt.coordinate);
  };

  /**
   * Optimaze route for waypoints
   *
   * @memberof HsRoutingController
   * @function optimizeRoute
   */
  $scope.optimizeRoute = function () {
    gjSrc.clear();
    if ($scope.wayPoints.length < 3) {
      console.log('This does not make sense with less than 3 points');
      return;
    } else {
      const nodeIds = $scope.wayPoints.map((d) => {
        return d.id;
      });
      const start = $scope.wayPoints[0].id;

      let finish;

      if ($scope.optimalRoute.isLoop === true) {
        finish = start;
      } else {
        finish = $scope.wayPoints[$scope.wayPoints.length - 1].id;
      }

      const move = function (array, from, to) {
        if (to === from) {
          return;
        }

        const target = array[from];
        const increment = to < from ? -1 : 1;

        for (let k = from; k != to; k += increment) {
          array[k] = array[k + increment];
        }
        array[to] = target;
        return array;
      };

      /**
       * Move selected waypoint up in order
       *
       * @memberof HsRoutingController
       * @function moveUp
       * @param {number} from Current position of waypoint in order
       */
      $scope.moveUp = function (from) {
        move($scope.wayPoints, from, from - 1);
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      };

      /**
       * Move selected waypoint down in order
       *
       * @memberof HsRoutingController
       * @function moveDown
       * @param {number} from Current position of waypoint in order
       */
      $scope.moveDown = function (from) {
        move($scope.wayPoints, from, from + 1);
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      };

      Routing.getOptimalRoute(nodeIds, start, finish).then((res) => {
        const nodes = res.data;
        if ($scope.optimalRoute.isLoop === true) {
          nodes.push(nodes[0]);
        }
        for (let i = 0; i < nodes.length - 1; i++) {
          Routing.getShortestRoute(nodes[i].id, nodes[i + 1].id).then((res) => {
            for (let f = 0; f < res.data.length; f++) {
              const feat = gjFormat.readFeature(res.data[f], {
                featureProjection: 'EPSG:3857',
              });
              gjSrc.addFeature(feat);
            }
          });
        }
      });
    }
  };

  /**
   * (PRIVATE) Handler to be invoked when the reachable area operation is activated
   *
   * @memberof HsRoutingController
   * @function reachableAreaClickHandler
   * @param {ol.ClickEvent} evt
   */
  var reachableAreaClickHandler = function (evt) {
    const lonlat = trans(evt.coordinate, true);

    Routing.getNearestNode(lonlat[0], lonlat[1]).then((res) => {
      if (res.status === 'success' && res.count > 0) {
        getReachableArea(res.data.id, +$scope.reachableArea.distance);
      }
    });
  };

  /**
   * (PRIVATE) Add a way point to the list (computes Route for Shortest route operation)
   *
   * @memberof HsRoutingController
   * @function addWayPoint
   * @param {ol.coordinate} coordinate
   */
  var addWayPoint = function (coordinate) {
    const lonlat = trans(coordinate, true);
    Routing.getNearestNode(lonlat[0], lonlat[1], 100).then((res) => {
      if (res.status === 'success') {
        gjSrc.addFeature(
          new Feature({
            geometry: new Point(trans([res.data.lon, res.data.lat])),
          })
        );

        $scope.wayPoints.push(jQuery.extend({}, res.data));

        if (
          $scope.operation === 'ShortestRoute' &&
          $scope.wayPoints.length == 2
        ) {
          getShortestRoute($scope.wayPoints[0].id, $scope.wayPoints[1].id);
        }
        if (!$scope.$$phase) {
          $scope.$digest();
        }
      }
    });
  };

  /**
   * (PRIVATE) Get route description as street list with their lengths
   *
   * @memberof HsRoutingController
   * @function getRouteDescription
   * @param {GeoJSON} geoJsonFeatures
   * @returns {Array} description List of streetnames and distances
   */
  const getRouteDescription = function (geoJsonFeatures) {
    const description = [];

    const descLine = {
      streetname: null,
      distance: 0,
    };

    let previousStreetname;
    let count = 0;
    for (let i = 0; i < geoJsonFeatures.length; i++) {
      const f = geoJsonFeatures[i];
      if (
        (f.properties.streetname !== previousStreetname && count > 0) ||
        count === geoJsonFeatures.length - 1
      ) {
        description.push(jQuery.extend({}, descLine));
      }

      if (f.properties.streetname !== previousStreetname) {
        descLine.streetname =
          f.properties.streetname !== ''
            ? f.properties.streetname
            : '<unnamed street>';
        descLine.distance = f.properties.distance;
      } else {
        descLine.distance += +f.properties.distance;
      }

      previousStreetname = f.properties.streetname;

      count++;
    }
    return description;
  };

  /**
   * (PRIVATE) Calculate the shortest route
   *
   * @memberof HsRoutingController
   * @function getShortestRoute
   * @param {number} fromNode - Identifier of from node
   * @param {number} toNode - Identifier of to node
   */
  var getShortestRoute = function (fromNode, toNode) {
    Routing.getShortestRoute(fromNode, toNode).then((res) => {
      if (res.status === 'success' && res.count > 0) {
        $scope.clearSearchResults();
        for (let i = 0; i < res.data.length; i++) {
          const feature = gjFormat.readFeature(res.data[i], {
            featureProjection: 'EPSG:3857',
          });
          gjSrc.addFeature(feature);
        }
        $scope.searchResults.length = 0;
        jQuery.extend($scope.searchResults, getRouteDescription(res.data));
        if (!$scope.$$phase) {
          $scope.$digest();
        }
      }
    });
  };

  /**
   * (PRIVATE) Calculate reachable area
   *
   * @memberof HsRoutingController
   * @function getReachableArea
   * @param {number} fromNode Node to compute area
   * @param {number} distance Maximum distance of area
   */
  var getReachableArea = function (fromNode, distance) {
    Routing.getReachableArea(fromNode, distance).then((res) => {
      gjSrc.clear();
      const f = gjFormat.readFeature(res.feature, {
        featureProjection: 'EPSG:3857',
      });
      f.set('hs_notqueryable', true);
      gjSrc.addFeature(f);
    });
  };

  /**
   * Activate route layer and routing interaction
   *
   * @memberof HsRoutingController
   * @function activate
   */
  $scope.activate = function () {
    map.addLayer(gjLyr);
    singleClickListener = map.on('singleclick', clickHandler);
  };

  /**
   * Deactivate route layer and routing interaction, clear data
   *
   * @memberof HsRoutingController
   * @function deactivate
   */
  $scope.deactivate = function () {
    map.removeLayer(gjLyr);
    gjSrc.clear();
    map.unByKey(singleClickListener);
    $scope.clearAll();
  };

  HsEventBusService.mainPanelChanges.subscribe(() => {
    if (HsLayoutService.mainpanel === 'routing') {
      setDefaultOperation();
      $scope.activate();
    } else {
      $scope.deactivate();
    }
  });

  $scope.$on('scope_loaded', (event, data) => {
    if (HsLayoutService.mainpanel === 'routing' && data === 'routing') {
      setDefaultOperation();
      $scope.activate();
    } else {
      $scope.deactivate();
    }
  });

  $scope.$emit('scope_loaded', 'routing');
};
