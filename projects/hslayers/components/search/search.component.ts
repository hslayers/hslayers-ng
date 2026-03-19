import {AsyncPipe} from '@angular/common';
import {Component, OnDestroy, OnInit, inject} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {
  HsPanelBaseComponent,
  HsPanelHeaderComponent,
} from 'hslayers-ng/common/panels';
import {HsSearchInputComponent} from './search-input.component';
import {HsSearchResultsComponent} from './search-results.component';

@Component({
  selector: 'hs-search',
  templateUrl: './search.component.html',

  imports: [
    HsPanelHeaderComponent,
    HsSearchInputComponent,
    HsSearchResultsComponent,
    AsyncPipe,
  ],
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
