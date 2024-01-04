import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/shared/core';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';
import {HsSidebarService} from 'hslayers-ng/components/sidebar';

@Component({
  selector: 'hs-search',
  templateUrl: './search.component.html',
})
export class HsSearchComponent
  extends HsPanelBaseComponent
  implements OnInit, OnDestroy
{
  replace = false;
  clearVisible = false;
  searchInputVisible: boolean;
  searchResultsReceivedSubscription: Subscription;
  name = 'search';

  constructor(
    private hsEventBusService: HsEventBusService,
    private hsConfig: HsConfig,
    public hsLayoutService: HsLayoutService,
    public hsLanguageService: HsLanguageService,
    public hsSidebarService: HsSidebarService,
  ) {
    super(hsLayoutService);
    this.searchResultsReceivedSubscription =
      this.hsEventBusService.searchResultsReceived.subscribe(() => {
        this.clearVisible = true;
      });
  }

  ngOnDestroy(): void {
    this.searchResultsReceivedSubscription.unsubscribe();
  }

  ngOnInit(): void {
    super.ngOnInit();
    window.innerWidth < this.hsConfig.mobileBreakpoint
      ? (this.searchInputVisible = false)
      : (this.searchInputVisible = true);
  }
}
