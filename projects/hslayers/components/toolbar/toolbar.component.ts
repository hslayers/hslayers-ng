import {Component, OnDestroy, inject} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsGuiOverlayBaseComponent} from 'hslayers-ng/common/panels';
import {HsToolbarPanelContainerService} from 'hslayers-ng/services/panels';

@Component({
  selector: 'hs-toolbar',
  templateUrl: './toolbar.component.html',
  standalone: false,
})
export class HsToolbarComponent
  extends HsGuiOverlayBaseComponent
  implements OnDestroy
{
  hsEventBusService = inject(HsEventBusService);
  hsToolbarPanelContainerService = inject(HsToolbarPanelContainerService);

  name = 'toolbar';
  collapsed = false;
  composition_title: any;
  composition_abstract: any;
  mapResetsSubscription: Subscription;

  constructor() {
    super();
    this.mapResetsSubscription = this.hsEventBusService.mapResets.subscribe(
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
