import {Component, OnDestroy} from '@angular/core';

import Feature from 'ol/Feature';
import {Geometry} from 'ol/geom';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsEventBusService} from '../core/event-bus.service';
import {HsSearchService} from './search.service';
import {setHighlighted} from '../../common/feature-extensions';

/**
 * Add search results template to page
 */
@Component({
  selector: 'hs-search-results',
  templateUrl: './partials/search-results.component.html',
})
export class HsSearchResultsComponent implements OnDestroy {
  searchResultsVisible: boolean;
  data: any = {};
  fcode_zoom_map: any;
  private ngUnsubscribe = new Subject<void>();
  constructor(
    private hsEventBusService: HsEventBusService,
    private hsSearchService: HsSearchService
  ) {
    this.hsEventBusService.searchResultsReceived
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((_) => {
        this.searchResultsReceived();
      });

    this.hsEventBusService.clearSearchResults
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((_) => {
        this.clear();
      });
  }
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
  /**
   * Handler for receiving results of search request, sends results to correct parser
   */
  searchResultsReceived(): void {
    this.data = this.hsSearchService.data;
    this.searchResultsVisible = true;
    this.hsSearchService.showResultsLayer();
  }
  clear(): void {
    this.searchResultsVisible = false;
  }

  /**
   * @param featureId - feature id
   * Finds feature from search result layer based on featureId
   */
  findFeature(featureId: string): Feature<Geometry> {
    return this.hsSearchService.searchResultsLayer
      .getSource()
      .getFeatureById(featureId);
  }
  /**
   * @param result - Search result record
   * @param highlight - Feature highlight state
   * Highlights feature, when hovering search list
   */
  highlightResult(result, highlight: boolean): void {
    const found = this.findFeature(result.featureId);
    if (found) {
      setHighlighted(found, highlight);
    }
  }
  /**
   * Zoom map to selected result from results list
   *
   * @param result - Selected result
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
    this.hsSearchService.selectResult(result, zoom_level);
  }
}
