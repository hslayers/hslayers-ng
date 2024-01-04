import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsCoreService} from 'hslayers-ng/shared/core';
import {HsEventBusService} from 'hslayers-ng/shared/core';
import {HsGuiOverlayBaseComponent} from '../../common/panels/gui-overlay-base.component';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsToolbarPanelContainerService} from './toolbar-panel-container.service';

@Component({
  selector: 'hs-toolbar',
  templateUrl: './toolbar.component.html',
})
export class HsToolbarComponent
  extends HsGuiOverlayBaseComponent
  implements OnDestroy
{
  name = 'toolbar';
  collapsed = false;
  composition_title: any;
  composition_abstract: any;
  mapResetsSubscription: Subscription;
  constructor(
    public HsEventBusService: HsEventBusService,
    public HsLayoutService: HsLayoutService,
    public HsCoreService: HsCoreService,
    public HsToolbarPanelContainerService: HsToolbarPanelContainerService,
  ) {
    super(HsLayoutService);
    this.mapResetsSubscription = this.HsEventBusService.mapResets.subscribe(
      () => {
        setTimeout(() => {
          delete this.composition_title;
          delete this.composition_abstract;
        });
      },
    );
  }
  ngOnDestroy(): void {
    this.mapResetsSubscription.unsubscribe();
  }

  /**
   * Change/read collapsed setting
   *
   * @returns Collapsed state
   * @param is - Value to set collapsed state to
   */
  isCollapsed(is: boolean): boolean {
    if (arguments.length > 0) {
      this.collapsed = is;
    }
    return this.collapsed;
  }
}
