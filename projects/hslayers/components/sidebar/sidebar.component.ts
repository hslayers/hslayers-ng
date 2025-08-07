import {Component, DestroyRef, OnDestroy, OnInit, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {Subscription, debounceTime} from 'rxjs';

import {HS_PRMS, HsShareUrlService} from 'hslayers-ng/services/share';
import {HsButton} from 'hslayers-ng/types';
import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsSidebarService} from 'hslayers-ng/services/sidebar';

@Component({
  selector: 'hs-sidebar',
  templateUrl: './sidebar.component.html',
  standalone: false,
})
export class HsSidebarComponent implements OnInit, OnDestroy {
  hsLayoutService = inject(HsLayoutService);
  hsSidebarService = inject(HsSidebarService);
  hsShareUrlService = inject(HsShareUrlService);
  hsConfig = inject(HsConfig);
  private hsEventBusService = inject(HsEventBusService);
  private destroyRef = inject(DestroyRef);

  configChangesSubscription: Subscription;
  buttons: HsButton[] = [];
  miniSidebarButton: {title: string};
  sidebarPosition: string;

  ngOnDestroy(): void {
    this.hsSidebarService.destroy();
  }

  ngOnInit(): void {
    const panel = this.hsShareUrlService.getParamValue(HS_PRMS.panel);
    this.hsSidebarService.buttons
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe((buttons) => {
        this.buttons = this.hsSidebarService.prepareForTemplate(buttons);
        this.hsSidebarService.setPanelState(this.buttons);
        this.hsSidebarService.setButtonVisibility(this.buttons);
      });
    this.miniSidebarButton = {
      title: 'SIDEBAR.additionalPanels',
    };
    if (panel) {
      setTimeout(() => {
        //Without timeout we get ExpressionChangedAfterItHasBeenCheckedError
        if (!this.hsLayoutService.minisidebar) {
          this.hsLayoutService.setMainPanel(panel);
        }
      });
    }
    this.hsEventBusService.layoutResizes
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.hsSidebarService.setButtonVisibility(this.buttons);
      });
    this.hsConfig.configChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.refreshButtons();
      });
    this.hsSidebarService.sidebarLoad.next();
  }

  /**
   * Refresh buttons array. Remove disabled ones and add the ones that were enabled
   */
  refreshButtons() {
    const disabledPanels = Object.entries(this.hsConfig.panelsEnabled).reduce(
      (acc, [panel, isEnabled]) => (isEnabled ? [...acc, panel] : acc),
      [],
    );

    /**
     * Filter out disabled
     */
    const filteredButtons = this.buttons.filter(
      (b) => !disabledPanels.includes(b.panel),
    );
    const filteredButtonsPanels = filteredButtons.map((b) => b.panel);

    /**
     * Add panels that were enabled
     */
    const toBeActivated = Object.entries(this.hsConfig.panelsEnabled)
      .reduce(
        (acc, [panel, isEnabled]) => (isEnabled ? [...acc, panel] : acc),
        [],
      )
      .filter((b) =>
        ['search', 'measure'].includes(b)
          ? this.resloveBtnWithCondition(b)
          : !filteredButtonsPanels.includes(b),
      );

    for (const b of toBeActivated) {
      filteredButtons.push(this.hsSidebarService.buttonDefinition[b]);
    }
    this.hsSidebarService.buttonsSubject.next(filteredButtons);
  }

  /**
   * Resolve whether search/measure buttons should be visible after config update.
   */
  private resloveBtnWithCondition(panel: string) {
    return !(
      this.hsConfig.componentsEnabled['guiOverlay'] &&
      this.hsConfig.componentsEnabled['toolbar'] &&
      this.hsConfig.componentsEnabled[`${panel}Toolbar`]
    );
  }

  /**
   * Seat whether to show all sidebar buttons or just a
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
    this.hsLayoutService.updPanelSpaceWidth();
    setTimeout(() => {
      this.hsEventBusService.mapSizeUpdates.next();
    }, 110);
  }
}
