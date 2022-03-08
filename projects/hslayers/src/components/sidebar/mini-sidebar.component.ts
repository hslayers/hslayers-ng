import {Component, Input, OnInit} from '@angular/core';
import {HsButton} from './button.interface';
import {HsConfig} from './../../config.service';
import {HsCoreService} from '../core/core.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsSidebarService} from './sidebar.service';
@Component({
  selector: 'hs-mini-sidebar',
  templateUrl: './partials/sidebar.html',
})
export class HsMiniSidebarComponent implements OnInit {
  @Input() app = 'default';
  buttons: HsButton[];
  miniSidebarButton: {title: () => string};
  constructor(
    public HsCoreService: HsCoreService,
    public HsSidebarService: HsSidebarService,
    public HsLayoutService: HsLayoutService,
    public HsConfig: HsConfig,
    private HsLanguageService: HsLanguageService
  ) {}
  ngOnInit() {
    this.HsSidebarService.apps[this.app].buttons.subscribe((buttons) => {
      this.buttons = buttons;
    });
    this.miniSidebarButton = {
      title: () =>
        this.HsLanguageService.getTranslation(
          'SIDEBAR.additionalPanels',
          undefined,
          this.app
        ),
    };
  }

  /**
   * Seat weather to show all sidebar buttons or just a
   * subset of important ones
   */
  toggleUnimportant(): void {
    this.HsSidebarService.get(this.app).showUnimportant =
      !this.HsSidebarService.get(this.app).showUnimportant;
  }
  /**
   * Toggle sidebar mode between expanded and narrow
   */
  toggleSidebar(): void {
    this.HsLayoutService.get(this.app).sidebarExpanded =
      !this.HsLayoutService.get(this.app).sidebarExpanded;
    setTimeout(() => {
      this.HsCoreService.updateMapSize(this.app);
    }, 110);
  }
}
