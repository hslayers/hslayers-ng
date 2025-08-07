import {Component, DestroyRef, OnInit, inject} from '@angular/core';
import {Observable, delay, map, startWith} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {HsButton} from 'hslayers-ng/types';
import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsSidebarService} from 'hslayers-ng/services/sidebar';

@Component({
  selector: 'hs-mini-sidebar',
  templateUrl: './sidebar.component.html',
  standalone: false,
})
export class HsMiniSidebarComponent implements OnInit {
  hsSidebarService = inject(HsSidebarService);
  hsLayoutService = inject(HsLayoutService);
  hsConfig = inject(HsConfig);
  private hsEventBusService = inject(HsEventBusService);

  buttons: HsButton[] = [];
  miniSidebarButton: {title: string};
  private destroyRef = inject(DestroyRef);

  isVisible: Observable<boolean>;

  ngOnInit() {
    this.hsSidebarService.buttons
      .pipe(takeUntilDestroyed(this.destroyRef))
      .pipe(startWith([]), delay(0))
      .subscribe((buttons) => {
        this.buttons = this.hsSidebarService.prepareForTemplate(buttons);
      });
    this.miniSidebarButton = {
      title: 'SIDEBAR.additionalPanels',
    };

    this.isVisible = this.hsLayoutService.mainpanel$.pipe(
      map((which) => {
        return which == 'sidebar';
      }),
    );
  }

  /**
   * Seat weather to show all sidebar buttons or just a
   * subset of important ones
   */
  toggleUnimportant(): void {
    this.hsSidebarService.showUnimportant =
      !this.hsSidebarService.showUnimportant;
  }

  /**
   * Toggle sidebar mode between expanded and narrow
   */
  toggleSidebar(): void {
    this.hsLayoutService.sidebarExpanded =
      !this.hsLayoutService.sidebarExpanded;
    setTimeout(() => {
      this.hsEventBusService.mapSizeUpdates.next();
    }, 110);
  }
}
