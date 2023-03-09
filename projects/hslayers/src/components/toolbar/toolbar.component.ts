import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsCoreService} from '../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/public-api';
import {HsToolbarPanelContainerService} from './toolbar-panel-container.service';

@Component({
  selector: 'hs-toolbar',
  templateUrl: './partials/toolbar.html',
})
export class HsToolbarComponent
  extends HsPanelBaseComponent
  implements OnDestroy {
  collapsed = false;
  composition_title: any;
  composition_abstract: any;
  mapResetsSubscription: Subscription;
  constructor(
    public HsEventBusService: HsEventBusService,
    public HsLayoutService: HsLayoutService,
    public HsCoreService: HsCoreService,
    public HsToolbarPanelContainerService: HsToolbarPanelContainerService
  ) {
    super(HsLayoutService);
    this.mapResetsSubscription = this.HsEventBusService.mapResets.subscribe(
      () => {
        setTimeout(() => {
          delete this.composition_title;
          delete this.composition_abstract;
        });
      }
    );
  }
  ngOnDestroy(): void {
    this.mapResetsSubscription.unsubscribe();
  }

  /**
   * Change/read collapsed setting
   *
   * @returns Collapsed state
   * @param is Value to set collapsed state to
   */
  isCollapsed(is: boolean): boolean {
    if (arguments.length > 0) {
      this.collapsed = is;
    }
    return this.collapsed;
  }

  isVisible(): boolean {
    return (
      this.HsLayoutService.panelEnabled('toolbar') &&
      this.HsLayoutService.componentEnabled('toolbar') &&
      this.HsLayoutService.componentEnabled('guiOverlay')
    );
  }
}
