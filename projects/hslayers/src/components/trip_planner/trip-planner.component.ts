import Feature from 'ol/Feature';
import {Component, OnInit} from '@angular/core';
import {HsConfig} from './../../config.service';
import {HsCoreService} from './../core/core.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from './../map/map.service';
import {HsTripPlannerService, Waypoint} from './trip-planner.service';
import {HsUtilsService} from '../utils/utils.service';

/**
 * @memberof hs.trip_planner
 * @ngdoc component
 * @name HsTripPlannerToolbarButtonComponent
 */
@Component({
  selector: 'hs-trip-planner',
  templateUrl: './partials/trip_planner.html',
})
export class HsTripPlannerComponent implements OnInit {
  loaderImage: string;
  timer: any;

  constructor(
    public HsMapService: HsMapService,
    public HsCoreService: HsCoreService,
    public HsTripPlannerService: HsTripPlannerService,
    public HsConfig: HsConfig,
    public HsLayoutService: HsLayoutService,
    public HsUtilsService: HsUtilsService
  ) {}
  ngOnInit(): void {
    this.loaderImage = 'img/ajax-loader.gif';
    if (this.HsConfig.default_layers === undefined) {
      this.HsConfig.default_layers = [];
    } else {
      this.HsConfig.default_layers.push(this.HsTripPlannerService.routeLayer);
    }
    this.HsMapService.loaded().then((map) => {
      map.addLayer(this.HsTripPlannerService.routeLayer);
      map.addLayer(this.HsTripPlannerService.waypointLayer);
      map.addInteraction(this.HsTripPlannerService.modify);
    });
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
    return this.HsTripPlannerService.formatDistance(wp);
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
    this.HsTripPlannerService.waypoints.forEach((wp: Waypoint) => {
      if (wp.routes.from) {
        tmp += parseFloat(wp.routes.from.get('distance'));
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
   */
  toggleEdit(waypoint: Feature): void {
    waypoint.name_editing = !waypoint.name_editing;
    this.HsTripPlannerService.storeWaypoints();
    waypoint.feature.set('highlighted', waypoint.name_editing);
  }
}
