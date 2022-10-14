import {Component, Input, OnInit} from '@angular/core';
import {HsButton} from './button.interface';
import {HsConfig} from './../../config.service';
import {HsCoreService} from '../core/core.service';
import {HsLayoutParams, HsLayoutService} from '../layout/layout.service';
import {HsSidebarService} from './sidebar.service';
import {Subject, delay, startWith, takeUntil} from 'rxjs';
@Component({
  selector: 'hs-mini-sidebar',
  templateUrl: './partials/sidebar.html',
})
export class HsMiniSidebarComponent implements OnInit {
  @Input() app = 'default';
  buttons: HsButton[] = [];
  miniSidebarButton: {title: string};
  end = new Subject<void>();
  layoutAppRef: HsLayoutParams;
  constructor(
    public HsCoreService: HsCoreService,
    public HsSidebarService: HsSidebarService,
    public HsLayoutService: HsLayoutService,
    public HsConfig: HsConfig
  ) {}
  ngOnInit() {
    this.layoutAppRef = this.HsLayoutService.get(this.app);
    this.HsSidebarService.apps[this.app].buttons
      .pipe(takeUntil(this.end))
      .pipe(startWith([]), delay(0))
      .subscribe((buttons) => {
        this.buttons = this.HsSidebarService.prepareForTemplate(buttons);
      });
    this.miniSidebarButton = {
      title: 'SIDEBAR.additionalPanels',
    };
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
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
