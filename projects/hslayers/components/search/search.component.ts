import {Component, OnDestroy, OnInit, inject} from '@angular/core';

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
  private hsEventBusService = inject(HsEventBusService);
  private hsConfig = inject(HsConfig);
  hsLanguageService = inject(HsLanguageService);

  replace = false;
  clearVisible = false;
  searchInputVisible: boolean;
  searchResultsReceivedSubscription: Subscription;
  name = 'search';

  constructor() {
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
    this.searchInputVisible =
      window.innerWidth >= this.hsConfig.mobileBreakpoint;
  }
}
