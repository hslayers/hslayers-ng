import {HsCoreService} from './../core/core.service';
import {HsSidebarService} from './sidebar.service';

import * as angular from 'angular';
import {Component, OnInit} from '@angular/core';
@Component({
  selector: 'hs-mini-sidebar',
  template: require('./partials/minisidebar.html'),
})
export class HsSidebarMiniComponent implements OnInit {
  constructor(
    private HsCoreService: HsCoreService,
    private HsSidebarService: HsSidebarService
  ) {}

  ngOnInit(): void {
    if (angular.isDefined(this.HsCoreService.config.createExtraMenu)) {
      this.HsCoreService.config.createExtraMenu(this.HsSidebarService);
    }
  }
}
