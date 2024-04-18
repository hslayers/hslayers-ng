import {Component, OnInit} from '@angular/core';

import {HsConfig} from 'hslayers-ng/config';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';
import {HsTripPlannerService, Waypoint} from './trip-planner.service';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {setHighlighted} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-trip-planner',
  templateUrl: './trip-planner.component.html',
})
export class HsTripPlannerComponent
  extends HsPanelBaseComponent
  implements OnInit
{
  timer: any;
  name = 'tripPlanner';

  constructor(
    public HsMapService: HsMapService,
    public HsTripPlannerService: HsTripPlannerService,
    public HsConfig: HsConfig,
    public HsUtilsService: HsUtilsService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public hsLanguageService: HsLanguageService,
  ) {
    super();
  }
  async ngOnInit(): Promise<void> {
    super.ngOnInit();
    if (this.HsConfig.default_layers === undefined) {
      this.HsConfig.default_layers = [];
    } else {
      this.HsConfig.default_layers.push(this.HsTripPlannerService.routeLayer);
    }
  }

  /**
   * Format waypoint route distance in a human friendly way
   * @param wp - Waypoint
   * @returns Distance
   */
  formatDistance(wp: Waypoint): string {
    return this.HsTripPlannerService.formatDistance(wp);
  }

  /**
   * Get the total distance for all waypoint routes
   * @returns Distance
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
   */
  toggleEdit(waypoint: Waypoint): void {
    waypoint.editMode = !waypoint.editMode;
    const src = this.HsTripPlannerService.waypointLayer.getSource();
    setHighlighted(src.getFeatureById(waypoint.featureId), waypoint.editMode);
  }
}
