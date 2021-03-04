import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsEventBusService} from '../core/event-bus.service';
import {HsSearchService} from './search.service';

/**
 * @name HsSearchResultsComponent
 * Add search results template to page
 */
@Component({
  selector: 'hs-search-results',
  templateUrl: './partials/searchresults.html',
})
export class HsSearchResultsComponent implements OnDestroy {
  searchResultsVisible: boolean;
  data: any = {};
  fcode_zoom_map: any;
  subscriptions: Subscription[] = [];
  constructor(
    public HsEventBusService: HsEventBusService,
    public HsSearchService: HsSearchService
  ) {
    this.subscriptions.push(
      this.HsEventBusService.searchResultsReceived.subscribe((_) => {
        this.searchResultsReceived();
      })
    );
    this.subscriptions.push(
      this.HsEventBusService.clearSearchResults.subscribe((_) => {
        this.clear();
      })
    );
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
  /**
   * Handler for receiving results of search request, sends results to correct parser
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
   * @param result Selected result
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
