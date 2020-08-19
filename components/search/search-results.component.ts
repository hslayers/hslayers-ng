import {CommonModule} from '@angular/common';
import {Component} from '@angular/core';
import {HsEventBusService} from '../core/event-bus.service';
import {HsSearchService} from './search.service';
/**
 * @memberof hs.search
 * @ngdoc component
 * @name HsSearchResultsComponent
 * @description Add search results template to page
 */
@Component({
  selector: 'hs-search-results',
  template: require('./partials/searchresults.html'),
})
export class HsSearchResultsComponent {
  searchResultsVisible: boolean;
  data: any = {};
  fcode_zoom_map: any;
  constructor(
    private HsEventBusService: HsEventBusService,
    private HsSearchService: HsSearchService
  ) {
    this.HsEventBusService.searchResultsReceived.subscribe((_) => {
      this.searchResultsReceived();
    });
    this.HsEventBusService.clearSearchResults.subscribe((_) => {
      this.clear();
    });
  }
  /**
   * Handler for receiving results of search request, sends results to correct parser
   *
   * @memberof HsSearchResultsComponent
   * @function searchResultsReceived
   * @param result
   * @param {object} r Result of search request
   * @param {string} provider Which provider sent the search results
   */
  searchResultsReceived(): void {
    this.data = this.HsSearchService.data;
    this.searchResultsVisible = true;
    this.HsSearchService.showResultsLayer();
  }
  clear(): void {
    this.searchResultsVisible = false;
  }
  /**
   * Zoom map to selected result from results list
   *
   * @memberof HsSearchResultsComponent
   * @function zoomTo
   * @param {object} result Selected result
   */
  zoomTo(result: any): void {
    this.fcode_zoom_map = {
      'PPLA': 12,
      'PPL': 15,
      'PPLC': 10,
      'ADM1': 9,
      'FRM': 15,
      'PPLF': 13,
      'LCTY': 13,
      'RSTN': 15,
      'PPLA3': 9,
      'AIRP': 13,
      'AIRF': 13,
      'HTL': 17,
      'STM': 14,
      'LK': 13,
    };
    let zoom_level = 10;
    if (
      result.fcode !== undefined &&
      this.fcode_zoom_map[result.fcode] !== undefined
    ) {
      zoom_level = this.fcode_zoom_map[result.fcode];
    }
    this.HsSearchService.selectResult(result, zoom_level);
  }
}
