import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subscription} from 'rxjs';

import {HS_PRMS} from '../permalink/get-params';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsSearchService} from './search.service';
import {HsShareUrlService} from '../permalink/share-url.service';

/**
 * Add search input template to page
 */
@Component({
  selector: 'hs-search-input',
  templateUrl: './search-input.component.html',
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
    window.innerWidth < this.hsConfig.mobileBreakpoint
      ? (this.searchInputVisible = false)
      : (this.searchInputVisible = true);
  }

  /**
   * Handler of search input, request search service and display results div
   */
  async queryChanged(): Promise<void> {
    await this.hsSearchService.hsMapService.loaded();
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
