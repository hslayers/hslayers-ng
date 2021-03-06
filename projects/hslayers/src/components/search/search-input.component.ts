import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsEventBusService} from '../core/event-bus.service';
import {HsSearchService} from './search.service';
import {HsShareUrlService} from '../permalink/share-url.service';

/**
 * @name HsSearchInputComponent
 * Add search input template to page
 */
@Component({
  selector: 'hs-search-input',
  templateUrl: './partials/searchinput.html',
})
export class HsSearchInputComponent implements OnInit, OnDestroy {
  query = '';
  searchInputVisible: boolean;
  clearvisible = false;
  searchResultsReceivedSubscription: Subscription;
  constructor(
    public HsSearchService: HsSearchService,
    public HsEventBusService: HsEventBusService,
    public HsShareUrlService: HsShareUrlService
  ) {
    this.searchResultsReceivedSubscription = this.HsEventBusService.searchResultsReceived.subscribe(
      (_) => {
        this.clearvisible = true;
      }
    );
  }
  ngOnDestroy(): void {
    this.searchResultsReceivedSubscription.unsubscribe();
  }

  ngOnInit(): void {
    if (this.HsShareUrlService.getParamValue('search')) {
      this.query = this.HsShareUrlService.getParamValue('search');
      this.queryChanged();
    }
    window.innerWidth < 767
      ? (this.searchInputVisible = false)
      : (this.searchInputVisible = true);
  }
  /**
   * Handler of search input, request search service and display results div
   *
   * @memberof HsSearchInputComponent
   * @function queryChanged
   */
  queryChanged(): void {
    if (this.query.length == 0) {
      this.clear();
      return;
    }
    this.HsSearchService.request(this.query);
  }
  /**
   * Remove previous search and search results
   *
   * @memberof HsSearchInputComponent
   * @function clear
   */
  clear(): void {
    this.query = '';
    this.clearvisible = false;
    this.HsSearchService.cleanResults();
    this.HsEventBusService.clearSearchResults.next();
  }
  toggleSearchInput(): void {
    this.searchInputVisible = !this.searchInputVisible;
    if (this.query != '') {
      this.clear();
    }
  }
}
