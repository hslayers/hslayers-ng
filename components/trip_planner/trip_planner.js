import 'focusIf';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';
import {Draw, Modify, Select} from 'ol/interaction';
import {GeoJSON} from 'ol/format';
import {GeometryType, LineString, Point, Polygon} from 'ol/geom';
import {Vector} from 'ol/source';
import {transform} from 'ol/proj';

/**
 * @namespace hs.trip_planner
 * @memberOf hs
 */
angular
  .module('hs.trip_planner', ['hs.map', 'hs.core', 'focus-if'])
  /**
   * @memberof hs.trip_planner
   * @ngdoc directive
   * @name hs.trip_planner.directive
   * @description Add trip planner panel html template to the map
   */
  .directive('hs.tripPlanner.directive', [
    'HsConfig',
    function (config) {
      return {
        template: require('components/trip_planner/partials/trip_planner.html'),
      };
    },
  ])

  /**
   * @memberof hs.trip_planner
   * @ngdoc service
   * @name HsTripPlannerService
   * @description Service managing trip planning functions - loading, adding, storing, removing waypoints and calculating route
   */
  .factory('HsTripPlannerService', [
    'HsCore',
    'HsMapService',
    'HsUtilsService',
    '$http',
    'HsPermalinkUrlService',
    function (HsCore, OlMap, utils, $http, permalink) {
      const me = {
        waypoints: [],
        scopes: [],
        /**
         * Refresh scopes phase
         * @memberof HsTripPlannerService
         * @function digestScopes
         */
        digestScopes: function () {
          angular.forEach(me.scopes, (scope) => {
            if (!scope.$$phase) {
              scope.$digest();
            }
          });
        },
        /**
         * Load selected trip data from plan4all server and calculate routes
         * @memberof HsTripPlannerService
         * @function loadWaypoints
         * @params {String} uuid Identifier of selected trip
         */
        loadWaypoints: function (uuid) {
          const trip_url = '<http://www.sdi4apps.eu/trips.rdf#' + uuid + '>';
          const query =
            'SELECT * FROM <http://www.sdi4apps.eu/trips.rdf> WHERE {' +
            trip_url +
            ' ?p ?o}';
          $http
            .get(
              '//data.plan4all.eu/sparql?default-graph-uri=&query=' +
                encodeURIComponent(query) +
                '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on'
            )
            .then((response) => {
              angular.forEach(response.results.bindings, (record) => {
                if (
                  record.p.value == 'http://www.sdi4apps.eu/trips.rdf#waypoints'
                ) {
                  me.waypoints = JSON.parse(record.o.value);
                }
              });
              me.calculateRoutes();
            });
        },
        /**
         * Add waypoint to waypoint list and recalculate route
         * @memberof HsTripPlannerService
         * @function addWaypoint
         * @param {Number} lon Longitude number (part of Ol.coordinate Array)
         * @param {Number} lat Latitude number (part of Ol.coordinate Array)
         */
        addWaypoint: function (lon, lat) {
          if (permalink.getParamValue('trip') == null) {
            me.trip = utils.generateUuid();
            permalink.push('trip', me.trip);
            permalink.update();
          }
          const wp = {
            lon: lon,
            lat: lat,
            name: 'Waypoint ' + (me.waypoints.length + 1),
            hash: ('Waypoint ' + me.waypoints.length + Math.random())
              .hashCode()
              .toString(),
            routes: [],
          };
          angular.forEach(me.scopes, (scope) => {
            if (angular.isDefined(scope.waypointAdded)) {
              scope.waypointAdded(wp);
            }
          });
          me.waypoints.push(wp);
          me.storeWaypoints();
          me.calculateRoutes();
          me.digestScopes();
        },
        /**
         * Store current waypoints on remote Plan4All server if possible
         * @memberof HsTripPlannerService
         * @function storeWaypoints
         */
        storeWaypoints: function () {
          if (permalink.getParamValue('trip_editable') == null) {
            return;
          }
          const waypoints = [];
          angular.forEach(me.waypoints, (wp) => {
            waypoints.push({
              name: wp.name,
              lon: wp.lon,
              lat: wp.lat,
              routes: [],
            });
          });
          const trip_url = '<http://www.sdi4apps.eu/trips.rdf#' + me.trip + '>';
          const waypoints_url = '<http://www.sdi4apps.eu/trips.rdf#waypoints>';
          const query =
            'WITH <http://www.sdi4apps.eu/trips.rdf> DELETE {?t ?p ?s} INSERT {' +
            trip_url +
            ' ' +
            waypoints_url +
            ' "' +
            angular.toJson(waypoints).replace(/"/g, '\\"') +
            '"} WHERE {?t ?p ?s. FILTER(?t = ' +
            trip_url +
            '). }';
          $http
            .post(
              '//data.plan4all.eu/sparql?default-graph-uri=&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
              {
                query: query,
              }
            )
            .then((response) => {
              console.log(response);
            });
        },
        /**
         * Remove selected waypoint from trip
         * @memberof HsTripPlannerService
         * @function removeWaypoint
         * @param {Object} wp Waypoint object to remove
         */
        removeWaypoint: function (wp) {
          const prev_index = me.waypoints.indexOf(wp) - 1;
          if (prev_index > -1 && me.waypoints[prev_index].routes.length > 0) {
            angular.forEach(me.waypoints[prev_index].routes, (route) => {
              angular.forEach(me.scopes, (scope) => {
                if (angular.isDefined(scope.routeRemoved)) {
                  scope.routeRemoved(route);
                }
              });
            });
            me.waypoints[prev_index].routes = [];
          }

          angular.forEach(me.scopes, (scope) => {
            angular.forEach(wp.routes, (route) => {
              if (angular.isDefined(scope.routeRemoved)) {
                scope.routeRemoved(route);
              }
            });
            scope.waypointRemoved(wp);
          });
          me.waypoints.splice(me.waypoints.indexOf(wp), 1);
          me.storeWaypoints();
          me.calculateRoutes();
          me.digestScopes();
        },
        /**
         * Calculate routes between stored waypoints
         * @memberof HsTripPlannerService
         * @function calculateRoutes
         */
        calculateRoutes: function () {
          for (let i = 0; i < me.waypoints.length - 1; i++) {
            const wpf = me.waypoints[i];
            const wpt = me.waypoints[i + 1];
            if (wpf.routes.length == 0) {
              wpt.loading = true;
              $.ajax({
                method: 'GET',
                url: utils.proxify(
                  'http://www.yournavigation.org/api/1.0/gosmore.php?flat=' +
                    wpf.lat +
                    '&flon=' +
                    wpf.lon +
                    '&tlat=' +
                    wpt.lat +
                    '&tlon=' +
                    wpt.lon +
                    '&format=geojson'
                ),
                cache: false,
                i: i,
              }).done(function (response) {
                const wpt = me.waypoints[this.i + 1];
                const wpf = me.waypoints[this.i];
                wpt.loading = false;
                const format = new GeoJSON();
                const feature = format.readFeatures(
                  {
                    'type': 'Feature',
                    'geometry': response,
                    'properties': response.properties,
                  },
                  {
                    dataProjection: response.crs.name,
                    featureProjection: OlMap.map
                      .getView()
                      .getProjection()
                      .getCode(),
                  }
                );
                wpf.routes.push(feature[0]);
                angular.forEach(me.scopes, (scope) => {
                  if (angular.isDefined(scope.routeAdded)) {
                    scope.routeAdded(feature);
                  }
                });
                me.digestScopes();
              });
            }
          }
        },
      };

      if (permalink.getParamValue('trip') != null) {
        me.trip = permalink.getParamValue('trip');
        me.loadWaypoints(me.trip);
        permalink.push('trip', me.trip);
      }

      return me;
    },
  ])

  /**
   * @memberof hs.trip_planner
   * @ngdoc directive
   * @name hs.tripPlanner.toolbarButtonDirective
   * @description Add trip planner button html template to the map
   */
  .directive('hs.tripPlanner.toolbarButtonDirective', [
    'HsConfig',
    function (config) {
      return {
        template: require('components/trip_planner/partials/toolbar_button_directive.html'),
      };
    },
  ])

  /**
   * @memberof hs.trip_planner
   * @ngdoc controller
   * @name HsTripPlannerController
   */
  .controller('HsTripPlannerController', [
    '$scope',
    'HsMapService',
    'HsCore',
    'HsTripPlannerService',
    'HsConfig',
    'HsLayoutService',
    function ($scope, OlMap, HsCore, service, config, layoutService) {
      const map = OlMap.map;
      $scope.loaderImage = config.hsl_path + 'img/ajax-loader.gif';

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
                ? config.hsl_path + 'img/pin_white_red32.png'
                : config.hsl_path + 'img/pin_white_blue32.png',
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

      OlMap.loaded().then((map) => {
        map.addLayer(vector);
      });

      if (angular.isUndefined(config.default_layers)) {
        config.default_layers = [];
      }
      config.default_layers.push(vector);

      $scope.service = service;
      service.scopes.push($scope);
      let timer;

      /**
       * Handler of adding waypoint in connected service
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
              OlMap.map.getView().getProjection().getCode()
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
              OlMap.map.getView().getProjection().getCode(),
              'EPSG:4326'
            );
            this.get('wp').lon = new_cords[0];
            this.get('wp').lat = new_cords[1];
            const prev_index = service.waypoints.indexOf(this.get('wp')) - 1;
            if (
              prev_index > -1 &&
              service.waypoints[prev_index].routes.length > 0
            ) {
              removeRoutesForWaypoint(service.waypoints[prev_index]);
            }
            if (timer != null) {
              clearTimeout(timer);
            }
            timer = setTimeout(() => {
              service.calculateRoutes();
            }, 500);
          },
          f
        );
      };

      /**
       * (PRIVATE) Remove routes from selected waypoint
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

      OlMap.map.addInteraction(modify);

      /**
       * Handler of adding computed route to layer
       * @memberof HsTripPlannerController
       * @function routeAdded
       * @param {GeoJSON} feature Route to add
       */
      $scope.routeAdded = function (feature) {
        source.addFeatures(feature);
      };

      /**
       * Remove selected route from source
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
        layoutService.setMainPanel('info');
      };

      $scope.$on('core.mainpanel_changed', (event) => {});

      $scope.$emit('scope_loaded', 'Trip planner');
    },
  ]);
