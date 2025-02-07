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
  configChangesSubscription: Subscription;

  buttons: HsButton[] = [];
  miniSidebarButton: {title: string};
  private destroyRef = inject(DestroyRef);

  sidebarPosition: string;
  constructor(
    public HsLayoutService: HsLayoutService,
    public HsSidebarService: HsSidebarService,
    public HsShareUrlService: HsShareUrlService,
    public HsConfig: HsConfig,
    private HsEventBusService: HsEventBusService,
  ) {}

  ngOnDestroy(): void {
    this.HsSidebarService.destroy();
  }

  ngOnInit(): void {
    const panel = this.HsShareUrlService.getParamValue(HS_PRMS.panel);
    this.HsSidebarService.buttons
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe((buttons) => {
        this.buttons = this.HsSidebarService.prepareForTemplate(buttons);
        this.HsSidebarService.setPanelState(this.buttons);
        this.HsSidebarService.setButtonVisibility(this.buttons);
      });
    this.miniSidebarButton = {
      title: 'SIDEBAR.additionalPanels',
    };
    if (panel) {
      setTimeout(() => {
        //Without timeout we get ExpressionChangedAfterItHasBeenCheckedError
        if (!this.HsLayoutService.minisidebar) {
          this.HsLayoutService.setMainPanel(panel);
        }
      });
    }
    this.HsEventBusService.layoutResizes
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.HsSidebarService.setButtonVisibility(this.buttons);
      });
    this.HsConfig.configChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.refreshButtons();
      });
    this.HsSidebarService.sidebarLoad.next();
  }

  /**
   * Refresh buttons array. Remove disabled ones and add the ones that were enabled
   */
  refreshButtons() {
    const disabledPanels = Object.entries(this.HsConfig.panelsEnabled).reduce(
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
    const toBeActivated = Object.entries(this.HsConfig.panelsEnabled)
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
      filteredButtons.push(this.HsSidebarService.buttonDefinition[b]);
    }
    this.HsSidebarService.buttonsSubject.next(filteredButtons);
  }

  /**
   * Resolve whether search/measure buttons should be visible after config update.
   */
  private resloveBtnWithCondition(panel: string) {
    return !(
      this.HsConfig.componentsEnabled['guiOverlay'] &&
      this.HsConfig.componentsEnabled['toolbar'] &&
      this.HsConfig.componentsEnabled[`${panel}Toolbar`]
    );
  }

  /**
   * Seat whether to show all sidebar buttons or just a
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
    this.HsLayoutService.updPanelSpaceWidth();
    setTimeout(() => {
      this.HsEventBusService.mapSizeUpdates.next();
    }, 110);
  }
}
