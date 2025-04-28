import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Subscription} from 'rxjs';

import {HS_PRMS, HsShareUrlService} from 'hslayers-ng/services/share';
import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsSearchService} from './search.service';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {HsMapService} from 'hslayers-ng/services/map';

/**
 * Add search input template to page
 */
@Component({
  selector: 'hs-search-input',
  templateUrl: './search-input.component.html',
  imports: [FormsModule, TranslateCustomPipe],
})
export class HsSearchInputComponent implements OnInit, OnDestroy {
  query = '';
  searchInputVisible: boolean;
  clearVisible = false;
  searchResultsReceivedSubscription: Subscription;
  constructor(
    private hsConfig: HsConfig,
    private hsSearchService: HsSearchService,
    private hsEventBusService: HsEventBusService,
    private hsShareUrlService: HsShareUrlService,
    private hsMapService: HsMapService,
  ) {
    this.searchResultsReceivedSubscription =
      this.hsEventBusService.searchResultsReceived.subscribe(() => {
        this.clearVisible = true;
      });
  }

  ngOnDestroy(): void {
    this.searchResultsReceivedSubscription.unsubscribe();
  }

  ngOnInit(): void {
    const query = this.hsShareUrlService.getParamValue(HS_PRMS.search);
    if (query) {
      this.query = query;
      this.queryChanged();
    }
    this.searchInputVisible = !(
      window.innerWidth < this.hsConfig.mobileBreakpoint
    );
  }

  /**
   * Handler of search input, request search service and display results div
   */
  async queryChanged(): Promise<void> {
    await this.hsMapService.loaded();
    if (this.query.length == 0) {
      this.clear();
      return;
    }
    this.hsSearchService.request(this.query);
  }

  /**
   * Remove previous search and search results
   */
  clear(): void {
    this.query = '';
    this.clearVisible = false;
    this.hsSearchService.cleanResults();
    this.hsEventBusService.clearSearchResults.next();
  }

  toggleSearchInput(): void {
    this.searchInputVisible = !this.searchInputVisible;
    if (this.query != '') {
      this.clear();
    }
  }
}
