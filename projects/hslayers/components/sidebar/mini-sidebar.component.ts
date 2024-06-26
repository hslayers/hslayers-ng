import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subject, delay, map, startWith, takeUntil} from 'rxjs';

import {HsButton} from 'hslayers-ng/types';
import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsSidebarService} from 'hslayers-ng/services/sidebar';

@Component({
  selector: 'hs-mini-sidebar',
  templateUrl: './sidebar.component.html',
})
export class HsMiniSidebarComponent implements OnInit, OnDestroy {
  buttons: HsButton[] = [];
  miniSidebarButton: {title: string};
  end = new Subject<void>();
  isVisible: Observable<boolean>;

  constructor(
    public HsSidebarService: HsSidebarService,
    public HsLayoutService: HsLayoutService,
    public HsConfig: HsConfig,
    private HsEventBusService: HsEventBusService,
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

    this.isVisible = this.HsLayoutService.mainpanel$.pipe(
      map((which) => {
        return which == 'sidebar';
      }),
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
      this.HsEventBusService.mapSizeUpdates.next();
    }, 110);
  }
}
