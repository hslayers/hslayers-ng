import Feature from 'ol/Feature';
import {Component, OnInit} from '@angular/core';
import {HsConfig} from './../../config.service';
import {HsCoreService} from './../core/core.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from './../map/map.service';
import {HsTripPlannerService, Waypoint} from './trip-planner.service';
import {HsUtilsService} from '../utils/utils.service';
import {setHighlighted} from '../../common/feature-extensions';

/**
 * @memberof hs.trip_planner
 * @ngdoc component
 * @name HsTripPlannerToolbarButtonComponent
 */
@Component({
  selector: 'hs-trip-planner',
  templateUrl: './trip_planner.html',
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
    public HsUtilsService: HsUtilsService,
    public HsLayerUtilsService: HsLayerUtilsService
  ) {}
  ngOnInit(): void {
    if (this.HsConfig.default_layers === undefined) {
      this.HsConfig.default_layers = [];
    } else {
      this.HsConfig.default_layers.push(this.HsTripPlannerService.routeLayer);
    }
    this.HsTripPlannerService.fillVectorLayers();
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
        tmp += wp.routes.from.get('summary').distance / 1000.0;
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
    setHighlighted(waypoint.feature, waypoint.name_editing);
  }
}
