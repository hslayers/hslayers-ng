import {Component, OnInit} from '@angular/core';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsQueryBaseService} from 'hslayers-ng/services/query';
import {HsQueryFeatureListComponent} from '../feature-list/feature-list.component';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
@Component({
  selector: 'hs-query-default-info-panel-body',
  templateUrl: './default-info-panel-body.component.html',
  standalone: true,
  imports: [
    HsQueryFeatureListComponent,
    NgbDropdownModule,
    TranslateCustomPipe,
  ],
})
export class HsQueryDefaultInfoPanelBodyComponent implements OnInit {
  featureInfoExpanded: boolean;
  constructor(public hsQueryBaseService: HsQueryBaseService) {}
  ngOnInit(): void {
    this.featureInfoExpanded = true;
  }
}
