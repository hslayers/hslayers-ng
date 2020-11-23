import {Component, OnInit} from '@angular/core';
import {HsQueryBaseService} from './query-base.service';

@Component({
  selector: 'hs-query-default-info-panel-body',
  template: require('./partials/default-info-panel-body.html'),
})
export class HsQueryDefaultInfoPanelBodyComponent implements OnInit {
  featureInfoExpanded: boolean;
  constructor(public HsQueryBaseService: HsQueryBaseService) {}
  ngOnInit(): void {
    this.featureInfoExpanded = true;
  }
}
