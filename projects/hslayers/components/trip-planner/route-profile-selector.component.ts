import {Component, Input, inject} from '@angular/core';

import {HsTripPlannerService} from './trip-planner.service';
import {RouteProfile} from './ors-profiles.const';

@Component({
  selector: 'hs-trip-planner-profile-selector',
  templateUrl: './route-profile-selector.component.html',
  standalone: false,
})
export class HsTripPlannerProfileSelectorComponent {
  hsTripPlannerService = inject(HsTripPlannerService);

  @Input() selectedProfile: RouteProfile;
  profilesExpanded: boolean;
}
