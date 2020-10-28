import {Component} from '@angular/core';
import {HsCoreService} from './../core/core.service';
import {HsLayoutService} from './../layout/layout.service';
/**
 * @memberof hs.trip_planner
 * @ngdoc component
 * @name HsTripPlannerToolbarButtonComponent
 */
@Component({
  selector: 'hs-trip-planner-toolbar-button',
  template: require('./partials/toolbar_button.html'),
})
export class HsTripPlannerToolbarButtonComponent {
  constructor(
    private HsCoreService: HsCoreService,
    private HsLayoutService: HsLayoutService
  ) {}
}
