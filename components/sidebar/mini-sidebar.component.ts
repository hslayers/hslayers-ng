import {Component, OnInit} from '@angular/core';
import {HsConfig} from './../../config.service';
import {HsCoreService} from '../core/core.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsSidebarService} from './sidebar.service';
@Component({
  selector: 'hs-mini-sidebar',
  templateUrl: './partials/sidebar.html',
})
export class HsMiniSidebarComponent implements OnInit {
  constructor(
    private HsCoreService: HsCoreService,
    private HsSidebarService: HsSidebarService,
    private HsLayoutService: HsLayoutService,
    private HsConfig: HsConfig
  ) {}

  ngOnInit(): void {
    if (this.HsCoreService.config.createExtraMenu !== undefined) {
      this.HsCoreService.config.createExtraMenu(this.HsSidebarService);
    }
  }
}
