import {HsConfig} from './../../config.service';
import {HsCoreService} from '../core/core.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsSidebarService} from './sidebar.service';

import * as angular from 'angular';
import {Component, OnInit} from '@angular/core';
@Component({
  selector: 'hs-mini-sidebar',
  template: require('./partials/sidebar.html'),
})
export class HsMiniSidebarComponent implements OnInit {
  constructor(
    private HsCoreService: HsCoreService,
    private HsSidebarService: HsSidebarService,
    private HsLayoutService: HsLayoutService,
    private HsConfig: HsConfig
  ) {}

  ngOnInit(): void {
    if (angular.isDefined(this.HsCoreService.config.createExtraMenu)) {
      this.HsCoreService.config.createExtraMenu(this.HsSidebarService);
    }
  }
}
