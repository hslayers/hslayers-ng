import {Component, OnInit} from '@angular/core';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslatePipe} from '@ngx-translate/core';

import {HsQueryBaseService} from 'hslayers-ng/services/query';
import {HsQueryFeatureListComponent} from '../feature-list/feature-list.component';

@Component({
  selector: 'hs-query-default-info-panel-body',
  templateUrl: './default-info-panel-body.component.html',
  imports: [HsQueryFeatureListComponent, NgbDropdownModule, TranslatePipe],
})
export class HsQueryDefaultInfoPanelBodyComponent implements OnInit {
  featureInfoExpanded: boolean;
  constructor(public hsQueryBaseService: HsQueryBaseService) {}
  ngOnInit(): void {
    this.featureInfoExpanded = true;
  }
}
