import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subject, delay, map, startWith, takeUntil} from 'rxjs';

import {HsButton} from 'hslayers-ng/common/types';
import {HsConfig} from 'hslayers-ng/config';
import {HsCoreService} from 'hslayers-ng/shared/core';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsSidebarService} from 'hslayers-ng/shared/sidebar';

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
    public HsCoreService: HsCoreService,
    public HsSidebarService: HsSidebarService,
    public HsLayoutService: HsLayoutService,
    public HsConfig: HsConfig,
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
      this.HsCoreService.updateMapSize();
    }, 110);
  }
}
