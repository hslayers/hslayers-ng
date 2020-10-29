import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import {Component, OnInit} from '@angular/core';
import {Fill, Icon, Stroke, Style} from 'ol/style';
import {HsConfig} from './../../config.service';
import {HsCoreService} from './../core/core.service';
import {HsLayoutService} from './../layout/layout.service';
import {HsMapService} from './../map/map.service';
import {HsTripPlannerService} from './trip-planner.service';
import {HsUtilsService} from '../utils/utils.service';
import {Modify} from 'ol/interaction';
import {Point} from 'ol/geom';
import {Vector} from 'ol/source';
import {transform} from 'ol/proj';

/**
 * @memberof hs.trip_planner
 * @ngdoc component
 * @name HsTripPlannerToolbarButtonComponent
 */
@Component({
  selector: 'hs-trip-planner',
  template: require('./partials/trip_planner.html'),
})
export class HsTripPlannerComponent implements OnInit {
  loaderImage: string;
  timer: any;
  movable_features = new Collection();
  source = new Vector({});
  constructor(
    private HsMapService: HsMapService,
    private HsCoreService: HsCoreService,
    private HsTripPlannerService: HsTripPlannerService,
    private HsConfig: HsConfig,
    private HsLayoutService: HsLayoutService,
    private HsUtilsService: HsUtilsService
  ) {}
  ngOnInit(): void {
    this.loaderImage = this.HsUtilsService.resolveEsModule(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('../../img/ajax-loader.gif')
    );
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
              ? this.HsConfig.hsl_path + 'img/pin_white_red32.png'
              : this.HsConfig.hsl_path + 'img/pin_white_blue32.png',
            crossOrigin: 'anonymous',
            anchor: [0.5, 1],
          }),
        }),
      ];
    };
    const vector = new VectorLayer({
      source: this.source,
      style: style,
      title: 'Travel route',
    });
    const modify = new Modify({
      features: this.movable_features,
    });
    if (this.HsConfig.default_layers === undefined) {
      this.HsConfig.default_layers = [];
    } else {
      this.HsConfig.default_layers.push(vector);
    }
    this.HsMapService.loaded().then((map) => {
      map.addLayer(vector);
      map.addInteraction(modify);
    });
  }

  /**
   * Handler of adding waypoint in connected service
   *
   * @memberof HsTripPlannerController
   * @function waypointAdded
   * @param {object} wp Waypoint ojbect, with lat, lon and routes array
   */
  waypointAdded(wp: any): void {
    const f = new Feature({
      geometry: new Point(
        transform(
          [wp.lon, wp.lat],
          'EPSG:4326',
          this.HsMapService.map.getView().getProjection().getCode()
        )
      ),
      wp: wp,
    });
    wp.feature = f;
    this.source.addFeature(f);
    this.movable_features.push(f);
    f.on(
      'change',
      function (e) {
        if (this.get('wp').routes.length > 0) {
          this.removeRoutesForWaypoint(this.get('wp'));
        }
        const new_cords = transform(
          f.getGeometry().getCoordinates(),
          this.HsMapService.map.getView().getProjection().getCode(),
          'EPSG:4326'
        );
        this.get('wp').lon = new_cords[0];
        this.get('wp').lat = new_cords[1];
        const prev_index =
          this.HsTripPlannerService.waypoints.indexOf(this.get('wp')) - 1;
        if (
          prev_index > -1 &&
          this.HsTripPlannerService.waypoints[prev_index].routes.length > 0
        ) {
          this.removeRoutesForWaypoint(
            this.HsTripPlannerService.waypoints[prev_index]
          );
        }
        if (this.timer !== null) {
          clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
          this.HsTripPlannerService.calculateRoutes();
        }, 500);
      },
      f
    );
  }

  /**
   * (PRIVATE) Remove routes from selected waypoint
   *
   * @memberof HsTripPlannerController
   * @function removeRoutesForWaypoint
   * @param {object} wp Waypoint to remove routes
   */
  removeRoutesForWaypoint(wp: any): void {
    wp.routes.forEach((r) => {
      this.routeRemoved(r);
    });
    wp.routes = [];
  }

  /**
   * Clear all waypoints from service and layer
   *
   * @memberof HsTripPlannerController
   * @function clearAll
   */
  clearAll(): void {
    this.HsTripPlannerService.waypoints = [];
    this.source.clear();
  }

  /**
   * Handler of adding computed route to layer
   *
   * @memberof HsTripPlannerController
   * @function routeAdded
   * @param {GeoJSON} feature Route to add
   */
  routeAdded(feature: Feature): void {
    this.source.addFeatures(feature);
  }

  /**
   * Remove selected route from source
   *
   * @memberof HsTripPlannerController
   * @function routeRemoved
   * @param {object} feature Route feature to remove
   */
  routeRemoved(feature: Feature): void {
    try {
      this.source.removeFeature(feature);
    } catch (ex) {}
  }

  /**
   * Remove selected waypoint from source
   *
   * @memberof HsTripPlannerController
   * @function waypointRemoved
   * @param {object} wp Waypoint feature to remove
   */
  waypointRemoved(wp: Feature): void {
    try {
      this.source.removeFeature(wp.feature);
    } catch (ex) {}
  }

  /**
   * Format waypoint route distance in a human friendly way
   *
   * @memberof HsTripPlannerController
   * @function formatDistance
   * @param {float} wp Wayoint
   * @returns {string} Distance
   */
  formatDistance(wp: Feature): string {
    if (wp.routes.length < 1) {
      return '';
    }
    const distance = wp.routes[0].get('distance');
    if (typeof distance == 'undefined') {
      return '';
    } else {
      return parseFloat(distance).toFixed(2) + 'km';
    }
  }

  /**
   * Get the total distance for all waypoint routes
   *
   * @memberof HsTripPlannerController
   * @function totalDistance
   * @returns {string} Distance
   */
  totalDistance(): string {
    let tmp = 0;
    this.HsTripPlannerService.waypoints.forEach((wp) => {
      if (wp.routes.length > 0) {
        tmp += parseFloat(wp.routes[0].get('distance'));
      }
    });
    return tmp.toFixed(2) + 'km';
  }

  /**
   * Remove selected waypoint from source
   *
   * @memberof HsTripPlannerController
   * @function toggleEdit
   * @param {object} waypoint
   * @param {unknown} e
   */
  toggleEdit(waypoint: Feature, e: any): void {
    waypoint.name_editing = !waypoint.name_editing;
    this.HsTripPlannerService.storeWaypoints();
    waypoint.feature.set('highlighted', waypoint.name_editing);
  }
  prevPanel(): void {
    this.HsLayoutService.setMainPanel('info');
  }
}
