import {Component, Input, inject} from '@angular/core';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
} from '@ng-bootstrap/ng-bootstrap';
import {NgClass} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

import {HsTripPlannerService} from './trip-planner.service';
import {RouteProfile} from './ors-profiles.const';

@Component({
  selector: 'hs-trip-planner-profile-selector',
  templateUrl: './route-profile-selector.component.html',
  imports: [
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgClass,
    TranslatePipe,
  ],
})
export class HsTripPlannerProfileSelectorComponent {
  hsTripPlannerService = inject(HsTripPlannerService);

  @Input() selectedProfile: RouteProfile;
  profilesExpanded: boolean;
}
