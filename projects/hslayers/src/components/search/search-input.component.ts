import {Component, Input, OnDestroy, OnInit} from '@angular/core';

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
  templateUrl: './partials/search-input.component.html',
})
export class HsSearchInputComponent implements OnInit, OnDestroy {
  @Input() app = 'default';
  query = '';
  searchInputVisible: boolean;
  clearVisible = false;
  searchResultsReceivedSubscription: Subscription;
  constructor(
    private hsConfig: HsConfig,
    private hsSearchService: HsSearchService,
    private hsEventBusService: HsEventBusService,
    private hsShareUrlService: HsShareUrlService
  ) {
    this.searchResultsReceivedSubscription =
      this.hsEventBusService.searchResultsReceived.subscribe((_) => {
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
    window.innerWidth < this.hsConfig.get(this.app).mobileBreakpoint
      ? (this.searchInputVisible = false)
      : (this.searchInputVisible = true);
  }
  /**
   * Handler of search input, request search service and display results div
   */
  async queryChanged(): Promise<void> {
    await this.hsSearchService.hsMapService.loaded(this.app);
    if (this.query.length == 0) {
      this.clear();
      return;
    }
    this.hsSearchService.request(this.query, this.app);
  }
  /**
   * Remove previous search and search results
   */
  clear(): void {
    this.query = '';
    this.clearVisible = false;
    this.hsSearchService.cleanResults(this.app);
    this.hsEventBusService.clearSearchResults.next({app: this.app});
  }
  toggleSearchInput(): void {
    this.searchInputVisible = !this.searchInputVisible;
    if (this.query != '') {
      this.clear();
    }
  }
}
