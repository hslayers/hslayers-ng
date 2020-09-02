import {Component, OnInit} from '@angular/core';
import {HsEventBusService} from '../core/event-bus.service';
import {HsSearchService} from './search.service';
import {HsShareUrlService} from '../permalink/share-url.service';
/**
 * @memberof hs.search
 * @ngdoc component
 * @name HsSearchInputComponent
 * @description Add search input template to page
 */
@Component({
  selector: 'hs-search-input',
  template: require('./partials/searchinput.html'),
})
export class HsSearchInputComponent implements OnInit {
  query = '';
  searchInputVisible: boolean;
  clearvisible = false;
  constructor(
    private HsSearchService: HsSearchService,
    private HsEventBusService: HsEventBusService,
    private HsShareUrlService: HsShareUrlService
  ) {
    this.HsEventBusService.searchResultsReceived.subscribe((_) => {
      this.clearvisible = true;
    });
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
}
