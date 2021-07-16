import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Draw, Modify} from 'ol/interaction';
import {Fill, Icon, Stroke, Style, Text} from 'ol/style';
import {GeoJSON} from 'ol/format';
import {Point} from 'ol/geom';
import {catchError, timeout} from 'rxjs/operators';
import {of} from 'rxjs';
import {transform} from 'ol/proj';

import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsMapService} from './../map/map.service';
import {HsShareUrlService} from './../permalink/share-url.service';
import {HsToastService} from '../layout/toast/toast.service';
import {HsUtilsService} from './../utils/utils.service';
import {getHighlighted} from '../../common/feature-extensions';
import {getTitle} from '../../common/layer-extensions';

export type Waypoint = {
  name: string;
  lon: number;
  lat: number;
  hash: number;
  routes: {from: Feature; to: Feature};
  feature;
  loading: boolean;
};

const WAYPOINT = 'wp';

export function setWaypoint(feature: Feature, wp: Waypoint): void {
  feature.set(WAYPOINT, wp);
}

export function getWaypoint(feature: Feature): Waypoint {
  return feature.get(WAYPOINT);
}

@Injectable({
  providedIn: 'root',
})
export class HsTripPlannerService {
  waypoints: Waypoint[] = [];
  trip: any = {};
  movable_features = new Collection();
  modify = new Modify({
    features: this.movable_features,
  });
  waypointSource: VectorSource;
  waypointLayer: VectorLayer;
  routeSource: VectorSource;
  routeLayer: VectorLayer;
  timer: any;
  vectorLayers: {layer: VectorLayer; title: string}[];
  selectedLayerWrapper: {
    route?: {layer: VectorLayer; title: string};
    waypoints?: {layer: VectorLayer; title: string};
  } = {};

  waypointRouteStyle = (feature, resolution) => {
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
          src: getHighlighted(feature)
            ? this.HsUtilsService.getAssetsPath() + 'img/pin_white_red32.png'
            : this.HsUtilsService.getAssetsPath() + 'img/pin_white_blue32.png',
          crossOrigin: 'anonymous',
          anchor: [0.5, 1],
        }),
        text: new Text({
          font: '12px Calibri,sans-serif',
          overflow: true,
          fill: new Fill({
            color: '#000',
          }),
          stroke: new Stroke({
            color: '#fff',
            width: 3,
          }),
          offsetY: -40,
          text: this.getTextOnFeature(feature),
        }),
      }),
    ];
  };

  constructor(
    public HsMapService: HsMapService,
    public HsUtilsService: HsUtilsService,
    private $http: HttpClient,
    public HsShareUrlService: HsShareUrlService,
    public HsEventBusService: HsEventBusService,
    private HsToastService: HsToastService,
    public HsLanguageService: HsLanguageService,
    private HsLayerUtilsService: HsLayerUtilsService
  ) {
    if (this.HsShareUrlService.getParamValue('trip') !== null) {
      this.trip = this.HsShareUrlService.getParamValue('trip');
      this.loadWaypoints(this.trip);
      this.HsShareUrlService.push('trip', this.trip);
    }
    this.HsMapService.loaded().then((map) => {
      map.addInteraction(this.modify);
    });
    this.HsEventBusService.mapClicked.subscribe(({coordinates}) => {
      if (!this.waypointLayer) {
        this.createWaypointLayer();
      }
      if (!this.routeLayer) {
        this.createRouteLayer();
      }
      //Don't add waypoints when drawing and measuring
      if (
        this.HsMapService.map
          .getInteractions()
          .getArray()
          .find((i) => i.getActive() && this.HsUtilsService.instOf(i, Draw))
      ) {
        return;
      }
      this.addWaypoint({
        x: coordinates.mapProjCoordinate[0],
        y: coordinates.mapProjCoordinate[1],
        lon: coordinates.epsg4326Coordinate[0],
        lat: coordinates.epsg4326Coordinate[1],
      });
    });
  }

  async fillVectorLayers(): Promise<void> {
    this.HsMapService.loaded().then((map) => {
      this.vectorLayers = [
        {
          layer: null,
          title: 'newLayer',
        },
        ...this.HsMapService.getLayersArray()
          .filter((layer) => this.HsLayerUtilsService.isLayerDrawable(layer))
          .map((layer) => {
            return {layer, title: getTitle(layer)};
          }),
      ];
      this.fillDefaultLayerWrapper('route');
      this.fillDefaultLayerWrapper('waypoints');
    });
  }

  private fillDefaultLayerWrapper(usage: 'route' | 'waypoints') {
    if (this.selectedLayerWrapper[usage]) {
      this.selectedLayerWrapper[usage] = this.vectorLayers.find(
        (w) => w.layer == this.selectedLayerWrapper[usage].layer
      );
    } else {
      this.selectedLayerWrapper[usage] = this.vectorLayers[0];
    }
  }

  createWaypointLayer(): void {
    this.waypointSource = new VectorSource();
    this.waypointLayer = new VectorLayer({
      title: this.HsLanguageService.getTranslation('TRIP_PLANNER.waypoints'),
      source: this.waypointSource,
      style: this.waypointRouteStyle,
    });
    this.HsMapService.map.addLayer(this.waypointLayer);
  }

  createRouteLayer(): void {
    this.routeSource = new VectorSource();
    this.routeLayer = new VectorLayer({
      title: this.HsLanguageService.getTranslation('TRIP_PLANNER.travelRoute'),
      source: this.routeSource,
      style: this.waypointRouteStyle,
    });
    this.HsMapService.map.addLayer(this.routeLayer);
  }

  /**
   * Select layer for storing route or waypoint features
   * @param layer - Wrapper object which contains OL layer and its title
   * @param usage - route or waypoints
   */
  selectLayer(
    layer: {layer: VectorLayer; title: string},
    usage: 'route' | 'waypoints'
  ): void {
    if (usage == 'route') {
      this.routeLayer = layer.layer;
      if (this.routeLayer) {
        this.routeSource = this.routeLayer.getSource();
      }
      this.selectedLayerWrapper.route = layer;
    }
    if (usage == 'waypoints') {
      this.waypointLayer = layer.layer;
      if (this.waypointLayer) {
        this.waypointSource = this.waypointLayer.getSource();
      }
      this.selectedLayerWrapper.waypoints = layer;
    }
  }

  getTextOnFeature(feature: Feature): string {
    let tmp = '';
    const wp: Waypoint = getWaypoint(feature);
    if (wp) {
      tmp = wp.name;
      if (wp.routes.to) {
        tmp += ` (${this.formatDistance(wp, 'to')})`;
      }
    }
    return tmp;
  }

  /**
   * Load selected trip data from plan4all server and calculate routes
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
   * @param {number} lon Longitude number (part of Ol.coordinate Array)
   * @param {number} lat Latitude number (part of Ol.coordinate Array)
   */
  addWaypoint({x, y, lon, lat}) {
    if (this.HsShareUrlService.getParamValue('trip') === null) {
      this.trip = this.HsUtilsService.generateUuid();
      this.HsShareUrlService.push('trip', this.trip);
      this.HsShareUrlService.update();
    }
    const wp: Waypoint = {
      lon,
      lat,
      name: 'Waypoint ' + (this.waypoints.length + 1),
      hash: this.HsUtilsService.hashCode(
        JSON.stringify('Waypoint ' + this.waypoints.length + Math.random())
      ),
      routes: {from: null, to: null},
      feature: null,
      loading: false,
    };
    wp.feature = new Feature({
      'wp': wp,
      geometry: new Point([x, y]),
    });
    this.waypointSource.addFeature(wp.feature);
    this.waypoints.push(wp);
    if (this.waypointAdded !== undefined) {
      this.waypointAdded(wp);
    }
    this.storeWaypoints();
    this.calculateRoutes();
  }

  /**
   * Handler of adding waypoint in connected service
   * @param wp - Waypoint object, with lat, lon and routes array
   */
  waypointAdded(wp: Waypoint): void {
    this.movable_features.push(wp.feature);
    wp.feature.getGeometry().on(
      'change',
      (e) => {
        this.removeRoutesForWaypoint(wp);
        const new_cords = transform(
          wp.feature.getGeometry().getCoordinates(),
          this.HsMapService.getCurrentProj().getCode(),
          'EPSG:4326'
        );
        wp.lon = new_cords[0];
        wp.lat = new_cords[1];
        const prev_index = this.waypoints.indexOf(wp) - 1;
        if (prev_index > -1) {
          this.waypoints[prev_index].routes.from = null;
          this.routeRemoved(this.waypoints[prev_index].routes.from);
        }
        if (this.timer !== null) {
          clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
          this.calculateRoutes();
        }, 500);
      },
      wp.feature
    );
  }

  /**
   * Remove selected route from source
   * @param feature - Route feature to remove
   */
  routeRemoved(feature: Feature): void {
    try {
      if (feature) {
        this.routeSource.removeFeature(feature);
      }
    } catch (ex) {
      throw ex;
    }
  }

  /**
   * (PRIVATE) Remove routes from selected waypoint
   * @param wp - Waypoint to remove routes
   */
  removeRoutesForWaypoint(wp: Waypoint): void {
    this.routeRemoved(wp.routes.from);
    this.routeRemoved(wp.routes.to);
    wp.routes = {from: null, to: null};
  }

  /**
   * Remove selected waypoint from source
   * @param wp - Waypoint feature to remove
   */
  waypointRemoved(wp: Waypoint): void {
    try {
      this.waypointSource.removeFeature(wp.feature);
    } catch (ex) {
      throw ex;
    }
  }

  /**
   * Store current waypoints on remote Plan4All server if possible
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
   * @param {object} wp Waypoint object to remove
   */
  removeWaypoint(wp) {
    const wpIndex = this.waypoints.indexOf(wp);
    const prev_index = wpIndex - 1;
    if (prev_index > -1) {
      this.waypoints[prev_index].routes.from = null;
    }
    this.routeRemoved(wp.routes.from);
    this.routeRemoved(wp.routes.to);
    const next_index = wpIndex + 1;
    if (next_index < this.waypoints.length) {
      this.waypoints[next_index].routes.to = null;
    }
    this.waypointRemoved(wp);
    this.waypoints.splice(this.waypoints.indexOf(wp), 1);
    this.storeWaypoints();
    this.calculateRoutes();
  }

  /**
   * Clear all waypoints from service and layer
   */
  clearAll(): void {
    this.waypoints = [];
    this.waypointSource.clear();
    this.routeSource.clear();
  }

  /**
   * Handler of adding computed route to layer
   * @param feature - Route to add
   */
  routeAdded(feature: Feature): void {
    this.routeSource.addFeatures(feature);
  }

  /**
   * Calculate routes between stored waypoints
   */
  calculateRoutes() {
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const wpf = this.waypoints[i];
      const wpt = this.waypoints[i + 1];
      if (wpf.routes.from === null) {
        wpt.loading = true;
        const url = this.HsUtilsService.proxify(
          'https://api.openrouteservice.org/v2/directions/driving-car/geojson'
        );
        this.$http
          .post(url, {
            'coordinates': [
              [wpf.lon, wpf.lat],
              [wpt.lon, wpt.lat],
            ],
          })
          .pipe(
            timeout(10000),
            catchError((e) => {
              let title = this.HsLanguageService.getTranslation(
                'TRIP_PLANNER.serviceDown'
              );
              if (e.status == 404) {
                title = this.HsLanguageService.getTranslation(
                  'TRIP_PLANNER.missingAuth'
                );
              }
              this.HsToastService.createToastPopupMessage(
                title,
                this.HsLanguageService.getTranslationIgnoreNonExisting(
                  'ERRORMESSAGES',
                  e.message,
                  {url: url}
                ),
                {disableLocalization: true}
              );
              return of(null);
            })
          )
          .subscribe((response: any) => {
            if (!response) {
              return;
            }
            const wpt = this.waypoints[i + 1];
            const wpf = this.waypoints[i];
            wpt.loading = false;
            const format = new GeoJSON();
            const features = format.readFeatures(response);
            features[0]
              .getGeometry()
              .transform('EPSG:4326', this.HsMapService.getCurrentProj());
            wpf.routes.from = features[0];
            wpt.routes.to = features[0];
            if (this.routeAdded !== undefined) {
              this.routeAdded(features);
            }
          });
      }
    }
  }

  /**
   * Format waypoint route distance in a human friendly way
   * @param wp - Wayoint
   * @param which
   * @returns Distance
   */
  formatDistance(wp: Waypoint, which?: string): string {
    which = which !== undefined ? which : 'from';
    if (wp.routes[which]) {
      const route = wp.routes[which];
      const distance = route?.get('summary').distance / 1000.0;
      if (distance == undefined) {
        return '';
      } else {
        return distance.toFixed(2) + 'km';
      }
    }
  }
}
