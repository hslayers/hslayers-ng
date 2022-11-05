import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import Layer from 'ol/layer/Layer';
import Source from 'ol/source/Source';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {Draw, Modify} from 'ol/interaction';
import {Fill, Icon, Stroke, Style, Text} from 'ol/style';
import {GeoJSON} from 'ol/format';
import {Point} from 'ol/geom';
import {catchError, lastValueFrom, of, timeout} from 'rxjs';
import {transform} from 'ol/proj';

import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsToastService} from '../layout/toast/toast.service';
import {HsUtilsService} from '../utils/utils.service';
import {getHighlighted} from '../../common/feature-extensions';
import {getTitle, setTitle} from '../../common/layer-extensions';

export type Waypoint = {
  name: string;
  lon: number;
  lat: number;
  hash: number;
  routes: {from: Feature<Geometry>; to: Feature<Geometry>};
  featureId;
  editMode?: boolean;
  loading: boolean;
};

const WAYPOINT = 'wp';

export function setWaypoint(feature: Feature<Geometry>, wp: Waypoint): void {
  feature.set(WAYPOINT, wp);
}

export function getWaypoint(feature: Feature<Geometry>): Waypoint {
  return feature.get(WAYPOINT);
}

class HsTripPlannerData {
  waypoints: Waypoint[] = [];
  trip: any = {};
  movable_features = new Collection<Feature<Geometry>>();
  modify: Modify;
  waypointSource: VectorSource<Point>;
  waypointLayer: VectorLayer<VectorSource<Point>>;
  routeSource: VectorSource<Geometry>;
  routeLayer: VectorLayer<VectorSource<Geometry>>;
  timer: any;
  vectorLayers: {layer: VectorLayer<VectorSource<Geometry>>; title: string}[];
  selectedLayerWrapper: {
    route?: {layer: VectorLayer<VectorSource<Geometry>>; title: string};
    waypoints?: {layer: VectorLayer<VectorSource<Geometry>>; title: string};
  } = {};

  constructor() {
    this.modify = new Modify({
      features: this.movable_features,
    });
  }
}

@Injectable({
  providedIn: 'root',
})
export class HsTripPlannerService {
  waypointRouteStyle;
  apps: {[key: string]: HsTripPlannerData} = {};

  constructor(
    public HsMapService: HsMapService,
    public HsUtilsService: HsUtilsService,
    private $http: HttpClient,
    public HsShareUrlService: HsShareUrlService,
    public HsEventBusService: HsEventBusService,
    private HsToastService: HsToastService,
    public HsLanguageService: HsLanguageService,
    private HsLayerUtilsService: HsLayerUtilsService,
    private HsLayoutService: HsLayoutService,
    private hsConfig: HsConfig
  ) {}

  async init(_app: string) {
    if (this.apps[_app] == undefined) {
      this.apps[_app] = new HsTripPlannerData();
    }
    await this.HsMapService.loaded(_app);
    const configRef = this.hsConfig.get(_app);
    (feature, resolution) => {
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
            src:
              configRef.assetsPath + getHighlighted(feature)
                ? 'img/pin_white_red32.png'
                : 'img/pin_white_blue32.png',
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
    this.HsMapService.getMap(_app).addInteraction(this.apps[_app].modify);
    this.HsEventBusService.mapClicked.subscribe(({coordinates, app}) => {
      if (app != _app) {
        return;
      }
      if (this.HsLayoutService.get(app).mainpanel != 'tripPlanner') {
        return;
      }
      if (!this.apps[app].waypointLayer) {
        this.createWaypointLayer(app);
      }
      if (!this.apps[app].routeLayer) {
        this.createRouteLayer(app);
      }
      //Don't add waypoints when drawing and measuring
      if (
        this.HsMapService.getMap(app)
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
        app,
      });
    });
  }

  async fillVectorLayers(app): Promise<void> {
    this.HsMapService.loaded(app).then((map) => {
      this.apps[app].vectorLayers = [
        {
          layer: null,
          title: 'newLayer',
        },
        ...this.HsMapService.getLayersArray(app)
          .filter((layer: Layer<Source>) =>
            this.HsLayerUtilsService.isLayerDrawable(layer)
          )
          .map((layer: VectorLayer<VectorSource<Geometry>>) => {
            return {layer, title: getTitle(layer)};
          }),
      ];
      this.fillDefaultLayerWrapper('route', app);
      this.fillDefaultLayerWrapper('waypoints', app);
    });
  }

  private fillDefaultLayerWrapper(usage: 'route' | 'waypoints', app: string) {
    if (this.apps[app].selectedLayerWrapper[usage]) {
      this.apps[app].selectedLayerWrapper[usage] = this.apps[
        app
      ].vectorLayers.find(
        (w) => w.layer == this.apps[app].selectedLayerWrapper[usage].layer
      );
    } else {
      this.apps[app].selectedLayerWrapper[usage] =
        this.apps[app].vectorLayers[0];
    }
  }

  createWaypointLayer(app: string): void {
    this.apps[app].waypointSource = new VectorSource();
    this.apps[app].waypointLayer = new VectorLayer({
      source: this.apps[app].waypointSource,
      style: this.waypointRouteStyle,
    });
    setTitle(
      this.apps[app].waypointLayer,
      this.HsLanguageService.getTranslation(
        'TRIP_PLANNER.waypoints',
        undefined,
        app
      )
    );
    this.HsMapService.getMap(app).addLayer(this.apps[app].waypointLayer);
  }

  createRouteLayer(app: string): void {
    this.apps[app].routeSource = new VectorSource();
    this.apps[app].routeLayer = new VectorLayer({
      source: this.apps[app].routeSource,
      style: this.waypointRouteStyle,
    });
    setTitle(
      this.apps[app].routeLayer,
      this.HsLanguageService.getTranslation(
        'TRIP_PLANNER.travelRoute',
        undefined,
        app
      )
    );
    this.HsMapService.getMap(app).addLayer(this.apps[app].routeLayer);
  }

  /**
   * Select layer for storing route or waypoint features
   * @param layer - Wrapper object which contains OL layer and its title
   * @param usage - route or waypoints
   */
  async selectLayer(
    layer: {layer: VectorLayer<VectorSource<Geometry>>; title: string},
    usage: 'route' | 'waypoints',
    app: string
  ): Promise<void> {
    if (usage == 'route') {
      this.apps[app].routeLayer = layer.layer;
      if (this.apps[app].routeLayer) {
        this.apps[app].routeSource = this.apps[app].routeLayer.getSource();
      }
      this.apps[app].selectedLayerWrapper.route = layer;
    }
    if (usage == 'waypoints') {
      this.apps[app].waypointLayer = layer.layer as VectorLayer<
        VectorSource<Point>
      >;
      if (this.apps[app].waypointLayer) {
        this.apps[app].waypointSource =
          this.apps[app].waypointLayer.getSource();
      }
      this.apps[app].routeSource.clear();
      this.apps[app].waypoints.length = 0;
      this.apps[app].selectedLayerWrapper.waypoints = layer;
      for (const feature of this.apps[app].waypointSource.getFeatures()) {
        const new_cords = transform(
          feature.getGeometry().getCoordinates(),
          this.HsMapService.getCurrentProj(app).getCode(),
          'EPSG:4326'
        );
        const wp: Waypoint = {
          lon: new_cords[0],
          lat: new_cords[1],
          name: 'Waypoint ' + (this.apps[app].waypoints.length + 1),
          hash: this.HsUtilsService.hashCode(
            JSON.stringify(
              'Waypoint ' + this.apps[app].waypoints.length + Math.random()
            )
          ),
          routes: {from: null, to: null},
          featureId: feature.getId(),
          loading: false,
        };
        this.apps[app].waypoints.push(wp);
        if (this.waypointAdded !== undefined) {
          this.waypointAdded(wp, app);
        }
        await this.calculateRoutes(app);
      }
    }
  }

  getTextOnFeature(feature: Feature<Geometry>): string {
    let tmp = '';
    const wp: Waypoint = getWaypoint(feature);
    if (wp) {
      tmp = wp.name;
      if (wp?.routes?.to) {
        tmp += ` (${this.formatDistance(wp, 'to')})`;
      }
    }
    return tmp;
  }

  /**
   * Add waypoint to waypoint list and recalculate route
   * @param {number} lon Longitude number (part of Ol.coordinate Array)
   * @param {number} lat Latitude number (part of Ol.coordinate Array)
   */
  addWaypoint({x, y, lon, lat, app}) {
    const wp: Waypoint = {
      lon,
      lat,
      name: 'Waypoint ' + (this.apps[app].waypoints.length + 1),
      hash: this.HsUtilsService.hashCode(
        JSON.stringify(
          'Waypoint ' + this.apps[app].waypoints.length + Math.random()
        )
      ),
      routes: {from: null, to: null},
      featureId: null,
      loading: false,
    };
    const feature = new Feature({
      'wp': wp,
      geometry: new Point([x, y]),
      id: this.HsUtilsService.generateUuid(),
    }) as Feature<Point>;
    feature.setId(feature.get('id'));
    wp.featureId = feature.getId();
    this.apps[app].waypointSource.addFeature(feature);
    this.apps[app].waypoints.push(wp);
    if (this.waypointAdded !== undefined) {
      this.waypointAdded(wp, app);
    }
    this.calculateRoutes(app);
  }

  /**
   * Handler of adding waypoint in connected service
   * @param wp - Waypoint object, with lat, lon and routes array
   */
  waypointAdded(wp: Waypoint, app: string): void {
    const feature = this.apps[app].waypointSource.getFeatureById(wp.featureId);
    this.apps[app].movable_features.push(feature);
    feature.getGeometry().on('change', (e) => {
      this.removeRoutesForWaypoint(wp, app);
      const new_cords = transform(
        feature.getGeometry().getCoordinates(),
        this.HsMapService.getCurrentProj(app).getCode(),
        'EPSG:4326'
      );
      wp.lon = new_cords[0];
      wp.lat = new_cords[1];
      const prev_index = this.apps[app].waypoints.indexOf(wp) - 1;
      if (prev_index > -1) {
        this.apps[app].waypoints[prev_index].routes.from = null;
        this.routeRemoved(
          this.apps[app].waypoints[prev_index].routes.from,
          app
        );
      }
      if (this.apps[app].timer !== null) {
        clearTimeout(this.apps[app].timer);
      }
      this.apps[app].timer = setTimeout(() => {
        this.calculateRoutes(app);
      }, 500);
    });
  }

  /**
   * Remove selected route from source
   * @param feature - Route feature to remove
   */
  routeRemoved(feature: Feature<Geometry>, app: string): void {
    try {
      if (feature) {
        this.apps[app].routeSource.removeFeature(feature);
      }
    } catch (ex) {
      throw ex;
    }
  }

  /**
   * (PRIVATE) Remove routes from selected waypoint
   * @param wp - Waypoint to remove routes
   */
  removeRoutesForWaypoint(wp: Waypoint, app: string): void {
    this.routeRemoved(wp.routes.from, app);
    this.routeRemoved(wp.routes.to, app);
    wp.routes = {from: null, to: null};
  }

  /**
   * Remove selected waypoint from source
   * @param wp - Waypoint feature to remove
   */
  waypointRemoved(wp: Waypoint, app: string): void {
    try {
      this.apps[app].waypointSource.removeFeature(
        this.apps[app].waypointSource.getFeatureById(wp.featureId)
      );
    } catch (ex) {
      throw ex;
    }
  }

  /**
   * Remove selected waypoint from trip
   * @param {object} wp Waypoint object to remove
   */
  removeWaypoint(wp, app) {
    const wpIndex = this.apps[app].waypoints.indexOf(wp);
    const prev_index = wpIndex - 1;
    if (prev_index > -1) {
      this.apps[app].waypoints[prev_index].routes.from = null;
    }
    this.routeRemoved(wp.routes.from, app);
    this.routeRemoved(wp.routes.to, app);
    const next_index = wpIndex + 1;
    if (next_index < this.apps[app].waypoints.length) {
      this.apps[app].waypoints[next_index].routes.to = null;
    }
    this.waypointRemoved(wp, app);
    this.apps[app].waypoints.splice(this.apps[app].waypoints.indexOf(wp), 1);
    this.calculateRoutes(app);
  }

  /**
   * Clear all waypoints from service and layer
   */
  clearAll(app: string): void {
    this.apps[app].waypoints = [];
    this.apps[app].waypointSource.clear();
    this.apps[app].routeSource.clear();
  }

  /**
   * Handler of adding computed route to layer
   * @param feature - Route to add
   */
  routeAdded(features: Feature<Geometry>[], app: string): void {
    this.apps[app].routeSource.addFeatures(features);
  }

  /**
   * Calculate routes between stored waypoints
   */
  async calculateRoutes(app: string): Promise<void> {
    for (let i = 0; i < this.apps[app].waypoints.length - 1; i++) {
      const wpf = this.apps[app].waypoints[i];
      if (wpf.routes.from === null) {
        const wpt = this.apps[app].waypoints[i + 1];
        wpt.loading = true;
        const url = this.HsUtilsService.proxify(
          'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
          app
        );
        const response = await lastValueFrom(
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
                  'TRIP_PLANNER.serviceDown',
                  undefined,
                  app
                );
                if (e.status == 404) {
                  title = this.HsLanguageService.getTranslation(
                    'TRIP_PLANNER.missingAuth',
                    undefined,
                    app
                  );
                }
                this.HsToastService.createToastPopupMessage(
                  title,
                  this.HsLanguageService.getTranslationIgnoreNonExisting(
                    'ERRORMESSAGES',
                    e.message,
                    {url},
                    app
                  ),
                  {
                    disableLocalization: true,
                    serviceCalledFrom: 'HsTripPlannerService',
                  },
                  app
                );
                return of(null);
              })
            )
        );
        if (!response) {
          return;
        }
        wpt.loading = false;
        const format = new GeoJSON();
        const features = format.readFeatures(response);
        features[0]
          .getGeometry()
          .transform('EPSG:4326', this.HsMapService.getCurrentProj(app));
        wpf.routes.from = features[0];
        wpt.routes.to = features[0];
        if (this.routeAdded !== undefined) {
          this.routeAdded(features, app);
        }
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
