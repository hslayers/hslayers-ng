import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsCoreService} from '../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsThemeService} from '../layout/themes/theme.service';

@Component({
  selector: 'hs-toolbar',
  templateUrl: './partials/toolbar.html',
})
export class HsToolbarComponent implements OnDestroy {
  collapsed = false;
  composition_title: any;
  composition_abstract: any;
  mapResetsSubscription: Subscription;
  constructor(
    public HsEventBusService: HsEventBusService,
    public HsLayoutService: HsLayoutService,
    public HsCoreService: HsCoreService,
    public HsThemeService: HsThemeService
  ) {
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

  measureButtonClicked(): void {
    this.HsLayoutService.setMainPanel('measure', true);
  }

  /**
   * Change/read collapsed setting
   *
   * @return Collapsed state
   * @param is Value to set collapsed state to
   */
  isCollapsed(is: boolean): boolean {
    if (arguments.length > 0) {
      this.collapsed = is;
    }
    return this.collapsed;
  }
  // $scope.$emit('scope_loaded', 'Toolbar');
  toggleTheme(): void {
    if (this.HsThemeService.isDarkTheme()) {
      this.HsThemeService.setLightTheme();
    } else {
      this.HsThemeService.setDarkTheme();
    }
  }
}
