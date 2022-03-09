import {Component, OnInit, ViewRef} from '@angular/core';

import {HsConfig} from './../../config.service';
import {HsCoreService} from './../core/core.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from './../map/map.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsSidebarService} from '../sidebar/sidebar.service';
import {HsTripPlannerService, Waypoint} from './trip-planner.service';
import {HsUtilsService} from '../utils/utils.service';
import {setHighlighted} from '../../common/feature-extensions';

@Component({
  selector: 'hs-trip-planner',
  templateUrl: './trip_planner.html',
})
export class HsTripPlannerComponent
  extends HsPanelBaseComponent
  implements OnInit {
  loaderImage: string;
  timer: any;
  name = 'tripPlanner';

  constructor(
    public HsMapService: HsMapService,
    public HsCoreService: HsCoreService,
    public HsTripPlannerService: HsTripPlannerService,
    public HsConfig: HsConfig,
    hsLayoutService: HsLayoutService,
    public HsUtilsService: HsUtilsService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public hsLanguageService: HsLanguageService,
    public hsSidebarService: HsSidebarService
  ) {
    super(hsLayoutService);
  }
  async ngOnInit(): Promise<void> {
    this.hsSidebarService.get(this.data.app).buttons.push({
      panel: 'tripPlanner',
      module: 'hs-trip-planner',
      order: 17,
      fits: true,
      title: () =>
        this.hsLanguageService.getTranslation('PANEL_HEADER.TRIP_PLANNER'),
      description: () =>
        this.hsLanguageService.getTranslation(
          'SIDEBAR.descriptions.TRIP_PLANNER'
        ),
      icon: 'icon-sextant',
    });
    await this.HsTripPlannerService.init(this.data.app);
    if (this.HsConfig.apps[this.data.app].default_layers === undefined) {
      this.HsConfig.apps[this.data.app].default_layers = [];
    } else {
      this.HsConfig.apps[this.data.app].default_layers.push(
        this.HsTripPlannerService.routeLayer
      );
    }
    this.HsTripPlannerService.fillVectorLayers(this.data.app);
  }

  /**
   * Format waypoint route distance in a human friendly way
   * @param {float} wp Wayoint
   * @returns {string} Distance
   */
  formatDistance(wp: Waypoint): string {
    return this.HsTripPlannerService.formatDistance(wp);
  }

  /**
   * Get the total distance for all waypoint routes
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
   * @param {object} waypoint
   */
  toggleEdit(waypoint: Waypoint): void {
    waypoint.editMode = !waypoint.editMode;
    const src = this.HsTripPlannerService.waypointLayer.getSource();
    setHighlighted(src.getFeatureById(waypoint.featureId), waypoint.editMode);
  }
}
