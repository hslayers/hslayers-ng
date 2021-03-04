import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsEventBusService} from '../core/event-bus.service';
import {HsSearchService} from './search.service';
import {HsShareUrlService} from './../permalink/share-url.service';
/**
 * @memberof hs.search
 * @ngdoc component
 * @name HsSearchComponent
 */
@Component({
  selector: 'hs-search',
  templateUrl: './partials/search.html',
})
export class HsSearchComponent implements OnInit, OnDestroy {
  replace = false;
  clearvisible = false;
  searchInputVisible: boolean;
  query = '';
  searchResultsReceivedSubscription: Subscription;
  constructor(
    public HsSearchService: HsSearchService,
    public HsEventBusService: HsEventBusService,
    public HsShareUrlService: HsShareUrlService
  ) {
    this.searchResultsReceivedSubscription = this.HsEventBusService.searchResultsReceived.subscribe(
      () => {
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
   */
  queryChanged(): void {
    this.HsSearchService.request(this.query);
  }
  //not being used anywhere

  // /**
  //  * Set property highlighted of result to state
  //  *
  //  * @memberof HsSearcComponent
  //  * @function highlightResult
  //  * @param {object} result Record to highlight
  //  * @param {string} state To highlight or not to highlight
  //  */
  // highlightResult(result: any, state: any): void {
  //   if (result.feature !== undefined) {
  //     setHighlighted(result.feature, state);
  //   }
  // }

  /**
   * Remove previous search and search results
   *
   */
  clear(): void {
    this.query = '';
    this.clearvisible = false;
    this.HsSearchService.cleanResults();
  }
}
