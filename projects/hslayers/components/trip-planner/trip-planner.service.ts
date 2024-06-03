import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {catchError, lastValueFrom, of, timeout} from 'rxjs';

import {Collection, Feature} from 'ol';
import {Draw, Modify} from 'ol/interaction';
import {Fill, Icon, Stroke, Style, Text} from 'ol/style';
import {GeoJSON} from 'ol/format';
import {Geometry, Point} from 'ol/geom';
import {Layer, Vector as VectorLayer} from 'ol/layer';
import {Source, Vector as VectorSource} from 'ol/source';
import {transform} from 'ol/proj';

import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsShareUrlService} from 'hslayers-ng/services/share';
import {HsToastService} from 'hslayers-ng/common/toast';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {getHighlighted} from 'hslayers-ng/common/extensions';
import {getTitle, setTitle} from 'hslayers-ng/common/extensions';

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

@Injectable({
  providedIn: 'root',
})
export class HsTripPlannerService {
  waypointRouteStyle;
  waypoints: Waypoint[] = [];
  trip: any = {};
  movable_features = new Collection<Feature<Geometry>>();
  modify: Modify;
  waypointSource: VectorSource<Feature<Point>>;
  waypointLayer: VectorLayer<Feature<Point>>;
  routeSource: VectorSource;
  routeLayer: VectorLayer<Feature>;
  timer: any;
  vectorLayers: {layer: VectorLayer<Feature>; title: string}[];
  selectedLayerWrapper: {
    route?: {layer: VectorLayer<Feature>; title: string};
    waypoints?: {layer: VectorLayer<Feature>; title: string};
  } = {};

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
    private hsConfig: HsConfig,
  ) {
    this.modify = new Modify({
      features: this.movable_features,
    });

    this.HsEventBusService.mapClicked.subscribe(({coordinates}) => {
      if (this.HsLayoutService.mainpanel != 'tripPlanner') {
        return;
      }
      if (!this.waypointLayer) {
        this.createWaypointLayer();
      }
      if (!this.routeLayer) {
        this.createRouteLayer();
      }
      //Don't add waypoints when drawing and measuring
      if (
        this.HsMapService.getMap()
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

    this.HsMapService.loaded().then((map) => {
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
                this.hsConfig.assetsPath + getHighlighted(feature)
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
      map.addInteraction(this.modify);
      this.fillVectorLayers();
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
          .filter((layer: Layer<Source>) =>
            this.HsLayerUtilsService.isLayerDrawable(layer),
          )
          .map((layer: VectorLayer<Feature>) => {
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
        (w) => w.layer == this.selectedLayerWrapper[usage].layer,
      );
    } else {
      this.selectedLayerWrapper[usage] = this.vectorLayers[0];
    }
  }

  createWaypointLayer(): void {
    this.waypointSource = new VectorSource();
    this.waypointLayer = new VectorLayer({
      source: this.waypointSource,
      style: this.waypointRouteStyle,
    });
    setTitle(
      this.waypointLayer,
      this.HsLanguageService.getTranslation(
        'TRIP_PLANNER.waypoints',
        undefined,
      ),
    );
    this.HsMapService.getMap().addLayer(this.waypointLayer);
  }

  createRouteLayer(): void {
    this.routeSource = new VectorSource();
    this.routeLayer = new VectorLayer({
      source: this.routeSource,
      style: this.waypointRouteStyle,
    });
    setTitle(
      this.routeLayer,
      this.HsLanguageService.getTranslation(
        'TRIP_PLANNER.travelRoute',
        undefined,
      ),
    );
    this.HsMapService.getMap().addLayer(this.routeLayer);
  }

  /**
   * Select layer for storing route or waypoint features
   * @param layer - Wrapper object which contains OL layer and its title
   * @param usage - route or waypoints
   */
  async selectLayer(
    layer: {layer: VectorLayer<Feature>; title: string},
    usage: 'route' | 'waypoints',
  ): Promise<void> {
    if (usage == 'route') {
      this.routeLayer = layer.layer;
      if (this.routeLayer) {
        this.routeSource = this.routeLayer.getSource();
      }
      this.selectedLayerWrapper.route = layer;
    }
    if (usage == 'waypoints') {
      this.waypointLayer = layer.layer as VectorLayer<Feature<Point>>;
      if (this.waypointLayer) {
        this.waypointSource = this.waypointLayer.getSource();
      }
      this.routeSource.clear();
      this.waypoints.length = 0;
      this.selectedLayerWrapper.waypoints = layer;
      for (const feature of this.waypointSource.getFeatures()) {
        const new_cords = transform(
          feature.getGeometry().getCoordinates(),
          this.HsMapService.getCurrentProj().getCode(),
          'EPSG:4326',
        );
        const wp: Waypoint = {
          lon: new_cords[0],
          lat: new_cords[1],
          name: 'Waypoint ' + (this.waypoints.length + 1),
          hash: this.HsUtilsService.hashCode(
            JSON.stringify('Waypoint ' + this.waypoints.length + Math.random()),
          ),
          routes: {from: null, to: null},
          featureId: feature.getId(),
          loading: false,
        };
        this.waypoints.push(wp);
        if (this.waypointAdded !== undefined) {
          this.waypointAdded(wp);
        }
        await this.calculateRoutes();
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
   * @param lon - Longitude number (part of Ol.coordinate Array)
   * @param lat - Latitude number (part of Ol.coordinate Array)
   */
  addWaypoint({
    x,
    y,
    lon,
    lat,
  }: {
    x: number;
    y: number;
    lon: number;
    lat: number;
  }) {
    const wp: Waypoint = {
      lon,
      lat,
      name: 'Waypoint ' + (this.waypoints.length + 1),
      hash: this.HsUtilsService.hashCode(
        JSON.stringify('Waypoint ' + this.waypoints.length + Math.random()),
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
    this.waypointSource.addFeature(feature);
    this.waypoints.push(wp);
    if (this.waypointAdded !== undefined) {
      this.waypointAdded(wp);
    }
    this.calculateRoutes();
  }

  /**
   * Handler of adding waypoint in connected service
   * @param wp - Waypoint object, with lat, lon and routes array
   */
  waypointAdded(wp: Waypoint): void {
    const feature = this.waypointSource.getFeatureById(wp.featureId);
    this.movable_features.push(feature);
    feature.getGeometry().on('change', (e) => {
      this.removeRoutesForWaypoint(wp);
      const new_cords = transform(
        feature.getGeometry().getCoordinates(),
        this.HsMapService.getCurrentProj().getCode(),
        'EPSG:4326',
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
    });
  }

  /**
   * Remove selected route from source
   * @param feature - Route feature to remove
   */
  routeRemoved(feature: Feature<Geometry>): void {
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
      this.waypointSource.removeFeature(
        this.waypointSource.getFeatureById(wp.featureId),
      );
    } catch (ex) {
      throw ex;
    }
  }

  /**
   * Remove selected waypoint from trip
   * @param wp - Waypoint object to remove
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
  routeAdded(features: Feature<Geometry>[]): void {
    this.routeSource.addFeatures(features);
  }

  /**
   * Calculate routes between stored waypoints
   */
  async calculateRoutes(): Promise<void> {
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const wpf = this.waypoints[i];
      if (wpf.routes.from === null) {
        const wpt = this.waypoints[i + 1];
        wpt.loading = true;
        const url = this.HsUtilsService.proxify(
          'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
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
                );
                if (e.status == 404) {
                  title = this.HsLanguageService.getTranslation(
                    'TRIP_PLANNER.missingAuth',
                    undefined,
                  );
                }
                this.HsToastService.createToastPopupMessage(
                  title,
                  this.HsLanguageService.getTranslationIgnoreNonExisting(
                    'ERRORMESSAGES',
                    e.message,
                    {url},
                  ),
                  {
                    disableLocalization: true,
                    serviceCalledFrom: 'HsTripPlannerService',
                  },
                );
                return of(null);
              }),
            ),
        );
        if (!response) {
          return;
        }
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
      }
    }
  }

  /**
   * Format waypoint route distance in a human friendly way
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
