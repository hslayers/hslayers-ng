import {GeoJSON} from 'ol/format';
import {HsEventBusService} from '../core/event-bus.service';
import {HsMapService} from './../map/map.service';
import {HsShareUrlService} from './../permalink/share-url.service';
import {HsUtilsService} from './../utils/utils.service';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsTripPlannerService {
  waypoints: any = [];
  trip: any = {};
  waypointAdded: any;
  waypointRemoved: any;
  routeRemoved: any;
  routeAdded: any;
  constructor(
    private HsMapService: HsMapService,
    private HsUtilsService: HsUtilsService,
    private $http: HttpClient,
    private HsShareUrlService: HsShareUrlService,
    private HsEventBusService: HsEventBusService
  ) {
    if (this.HsShareUrlService.getParamValue('trip') !== null) {
      this.trip = this.HsShareUrlService.getParamValue('trip');
      this.loadWaypoints(this.trip);
      this.HsShareUrlService.push('trip', this.trip);
    }
    this.HsEventBusService.mapClicked.subscribe(({coordinates}) => {
      this.addWaypoint({
        x: coordinates.mapProjCoordinate[0],
        y: coordinates.mapProjCoordinate[1],
        lon: coordinates.epsg4326Coordinate[0],
        lat: coordinates.epsg4326Coordinate[1],
      });
    });
  }
  /**
   * Load selected trip data from plan4all server and calculate routes
   *
   * @memberof HsTripPlannerService
   * @function loadWaypoints
   * @params {string} uuid Identifier of selected trip
   * @param uuid
   */
  loadWaypoints(uuid) {
    const trip_url = '<http://www.sdi4apps.eu/trips.rdf#' + uuid + '>';
    const query =
      'SELECT * FROM <http://www.sdi4apps.eu/trips.rdf> WHERE {' +
      trip_url +
      ' ?p ?o}';
    this.$http
      .get(
        '//data.plan4all.eu/sparql?default-graph-uri=&query=' +
          encodeURIComponent(query) +
          '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on'
      )
      .subscribe((response: any) => {
        response.results.bindings.forEach((record: any) => {
          if (record.p.value == 'http://www.sdi4apps.eu/trips.rdf#waypoints') {
            this.waypoints = JSON.parse(record.o.value);
          }
        });
        this.calculateRoutes();
      });
  }
  /**
   * Add waypoint to waypoint list and recalculate route
   *
   * @memberof HsTripPlannerService
   * @function addWaypoint
   * @param {number} lon Longitude number (part of Ol.coordinate Array)
   * @param {number} lat Latitude number (part of Ol.coordinate Array)
   */
  addWaypoint({x, y, lon, lat}) {
    if (this.HsShareUrlService.getParamValue('trip') === null) {
      this.trip = this.HsUtilsService.generateUuid();
      this.HsShareUrlService.push('trip', this.trip);
      this.HsShareUrlService.update();
    }
    const wp = {
      lon: lon,
      lat: lat,
      name: 'Waypoint ' + (this.waypoints.length + 1),
      hash: this.HsUtilsService.hashCode(
        JSON.stringify('Waypoint ' + this.waypoints.length + Math.random())
      ),
      routes: [],
    };
    if (this.waypointAdded !== undefined) {
      this.waypointAdded(wp);
    }
    this.waypoints.push(wp);
    this.storeWaypoints();
    this.calculateRoutes();
  }
  /**
   * Store current waypoints on remote Plan4All server if possible
   *
   * @memberof HsTripPlannerService
   * @function storeWaypoints
   */
  storeWaypoints() {
    if (this.HsShareUrlService.getParamValue('trip_editable') === null) {
      return;
    }
    const waypoints = [];
    this.waypoints.forEach((wp) => {
      waypoints.push({
        name: wp.name,
        lon: wp.lon,
        lat: wp.lat,
        routes: [],
      });
    });
    const trip_url = '<http://www.sdi4apps.eu/trips.rdf#' + this.trip + '>';
    const waypoints_url = '<http://www.sdi4apps.eu/trips.rdf#waypoints>';
    const query =
      'WITH <http://www.sdi4apps.eu/trips.rdf> DELETE {?t ?p ?s} INSERT {' +
      trip_url +
      ' ' +
      waypoints_url +
      ' "' +
      JSON.stringify(waypoints).replace(/"/g, '\\"') +
      '"} WHERE {?t ?p ?s. FILTER(?t = ' +
      trip_url +
      '). }';
    this.$http
      .post(
        '//data.plan4all.eu/sparql?default-graph-uri=&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
        {
          query: query,
        }
      )
      .subscribe((response) => {
        console.log(response);
      });
  }
  /**
   * Remove selected waypoint from trip
   *
   * @memberof HsTripPlannerService
   * @function removeWaypoint
   * @param {object} wp Waypoint object to remove
   */
  removeWaypoint(wp) {
    const prev_index = this.waypoints.indexOf(wp) - 1;
    if (prev_index > -1 && this.waypoints[prev_index].routes.length > 0) {
      this.waypoints[prev_index].routes.forEach((route) => {
        if (this.routeRemoved !== undefined) {
          this.routeRemoved(route);
        }
      });
      this.waypoints[prev_index].routes = [];
    }

    wp.routes.forEach((route) => {
      if (this.routeRemoved !== undefined) {
        this.routeRemoved(route);
      }
      this.waypointRemoved(wp);
    });
    this.waypoints.splice(this.waypoints.indexOf(wp), 1);
    this.storeWaypoints();
    this.calculateRoutes();
  }
  /**
   * Calculate routes between stored waypoints
   *
   * @memberof HsTripPlannerService
   * @function calculateRoutes
   */
  calculateRoutes() {
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const wpf = this.waypoints[i];
      const wpt = this.waypoints[i + 1];
      if (wpf.routes.length == 0) {
        wpt.loading = true;
        const url = this.HsUtilsService.proxify(
          'http://www.yournavigation.org/api/1.0/gosmore.php?flat=' +
            wpf.lat +
            '&flon=' +
            wpf.lon +
            '&tlat=' +
            wpt.lat +
            '&tlon=' +
            wpt.lon +
            '&format=geojson'
        );
        this.$http
          .get(url, {params: {cache: 'false', i: i.toString()}})
          .subscribe((response: any) => {
            const wpt = this.waypoints[i + 1];
            const wpf = this.waypoints[i];
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
                featureProjection: this.HsMapService.map
                  .getView()
                  .getProjection()
                  .getCode(),
              }
            );
            wpf.routes.push(feature[0]);
            if (this.routeAdded !== undefined) {
              this.routeAdded(feature);
            }
          });
      }
    }
  }
}
