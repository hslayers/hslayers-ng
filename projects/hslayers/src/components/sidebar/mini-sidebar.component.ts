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
    public HsCoreService: HsCoreService,
    public HsSidebarService: HsSidebarService,
    public HsLayoutService: HsLayoutService,
    public HsConfig: HsConfig
  ) {}

  ngOnInit(): void {
    if (this.HsCoreService.config.createExtraMenu !== undefined) {
      this.HsCoreService.config.createExtraMenu(this.HsSidebarService);
    }
  }

  /**
   * Seat weather to show all sidebar buttons or just a
   * subset of important ones
   *
   * @memberof HsSidebarComponent
   * @function toggleUnimportant
   */
  toggleUnimportant(): void {
    this.HsSidebarService.showUnimportant = !this.HsSidebarService
      .showUnimportant;
  }
  /**
   * Toggle sidebar mode between expanded and narrow
   *
   * @memberof HsSidebarComponent
   * @function toggleSidebar
   */
  toggleSidebar(): void {
    this.HsLayoutService.sidebarExpanded = !this.HsLayoutService
      .sidebarExpanded;
    setTimeout(() => {
      this.HsCoreService.updateMapSize();
    }, 110);
  }
}
