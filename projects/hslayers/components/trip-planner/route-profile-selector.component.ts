import {Component, Input} from '@angular/core';

import {HsTripPlannerService} from './trip-planner.service';
import {RouteProfile} from './ors-profiles.const';

@Component({
  selector: 'hs-trip-planner-profile-selector',
  templateUrl: './route-profile-selector.component.html',
})
export class HsTripPlannerProfileSelectorComponent {
  @Input() selectedProfile: RouteProfile;
  profilesExpanded: boolean;

  constructor(public hsTripPlannerService: HsTripPlannerService) {}
}
