import {GeoJSON} from 'ol/format';

export const HsTripPlannerService = (
  HsMapService,
  HsUtilsService,
  $http,
  HsPermalinkUrlService
) => {
  'ngInject';
  const me = {
    waypoints: [],
    scopes: [],
    /**
     * Refresh scopes phase
     *
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
     *
     * @memberof HsTripPlannerService
     * @function loadWaypoints
     * @params {String} uuid Identifier of selected trip
     * @param uuid
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
     *
     * @memberof HsTripPlannerService
     * @function addWaypoint
     * @param {number} lon Longitude number (part of Ol.coordinate Array)
     * @param {number} lat Latitude number (part of Ol.coordinate Array)
     */
    addWaypoint: function (lon, lat) {
      if (HsPermalinkUrlService.getParamValue('trip') == null) {
        me.trip = HsUtilsService.generateUuid();
        HsPermalinkUrlService.push('trip', me.trip);
        HsPermalinkUrlService.update();
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
     *
     * @memberof HsTripPlannerService
     * @function storeWaypoints
     */
    storeWaypoints: function () {
      if (HsPermalinkUrlService.getParamValue('trip_editable') == null) {
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
     *
     * @memberof HsTripPlannerService
     * @function removeWaypoint
     * @param {object} wp Waypoint object to remove
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
     *
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
            url: HsUtilsService.proxify(
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
                featureProjection: HsMapService.map
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

  if (HsPermalinkUrlService.getParamValue('trip') != null) {
    me.trip = HsPermalinkUrlService.getParamValue('trip');
    me.loadWaypoints(me.trip);
    HsPermalinkUrlService.push('trip', me.trip);
  }

  return me;
};
