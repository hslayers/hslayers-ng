import {Component, Input, OnInit} from '@angular/core';
import {HsButton} from './button.interface';
import {HsConfig} from './../../config.service';
import {HsCoreService} from '../core/core.service';
import {HsLayoutParams, HsLayoutService} from '../layout/layout.service';
import {HsSidebarService} from './sidebar.service';

import {HsEventBusService} from '../core/event-bus.service';

import {Observable, Subject, delay, map, startWith, takeUntil} from 'rxjs';
@Component({
  selector: 'hs-mini-sidebar',
  templateUrl: './partials/sidebar.html',
})
export class HsMiniSidebarComponent implements OnInit {
  buttons: HsButton[] = [];
  miniSidebarButton: {title: string};
  end = new Subject<void>();
  isVisible: Observable<boolean>;

  constructor(
    public HsCoreService: HsCoreService,
    public HsSidebarService: HsSidebarService,
    public HsLayoutService: HsLayoutService,
    public HsConfig: HsConfig,
    private HsEventBusService: HsEventBusService
  ) {}
  ngOnInit() {
    this.HsSidebarService.buttons
      .pipe(takeUntil(this.end))
      .pipe(startWith([]), delay(0))
      .subscribe((buttons) => {
        this.buttons = this.HsSidebarService.prepareForTemplate(buttons);
      });
    this.miniSidebarButton = {
      title: 'SIDEBAR.additionalPanels',
    };

    this.isVisible = this.HsEventBusService.mainPanelChanges.pipe(
      map((which) => {
        return which == 'sidebar';
      })
    );
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
    this.HsSidebarService.showUnimportant =
      !this.HsSidebarService.showUnimportant;
  }
  /**
   * Toggle sidebar mode between expanded and narrow
   */
  toggleSidebar(): void {
    this.HsLayoutService.sidebarExpanded =
      !this.HsLayoutService.sidebarExpanded;
    setTimeout(() => {
      this.HsCoreService.updateMapSize();
    }, 110);
  }
}
