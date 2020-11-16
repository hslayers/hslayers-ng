import {Component, OnInit} from '@angular/core';
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
export class HsSearchComponent implements OnInit {
  replace = false;
  clearvisible = false;
  searchInputVisible: boolean;
  query = '';
  constructor(
    private HsSearchService: HsSearchService,
    private HsEventBusService: HsEventBusService,
    private HsShareUrlService: HsShareUrlService
  ) {
    this.HsEventBusService.searchResultsReceived.subscribe(() => {
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
   * @memberof HsSearcComponent
   * @function queryChanged
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
  //     result.feature.set('highlighted', state);
  //   }
  // }
  /**
   * Remove previous search and search results
   *
   * @memberof HsSearchComponent
   * @function clear
   */
  clear(): void {
    this.query = '';
    this.clearvisible = false;
    this.HsSearchService.cleanResults();
  }
}
