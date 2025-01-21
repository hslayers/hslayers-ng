import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';

@Component({
  selector: 'hs-search',
  templateUrl: './search.component.html',
  standalone: false,
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
    public hsLanguageService: HsLanguageService,
  ) {
    super();
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
