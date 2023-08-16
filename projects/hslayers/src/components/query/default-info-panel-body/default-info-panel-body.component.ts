import {Component, OnInit} from '@angular/core';

import {HsQueryBaseService} from '../query-base.service';

@Component({
  selector: 'hs-query-default-info-panel-body',
  templateUrl: './default-info-panel-body.component.html',
})
export class HsQueryDefaultInfoPanelBodyComponent implements OnInit {
  featureInfoExpanded: boolean;
  constructor(public hsQueryBaseService: HsQueryBaseService) {}
  ngOnInit(): void {
    this.featureInfoExpanded = true;
  }
}
