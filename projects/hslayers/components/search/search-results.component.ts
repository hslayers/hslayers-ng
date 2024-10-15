import {Component} from '@angular/core';
import {KeyValuePipe, NgClass} from '@angular/common';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';

import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsSearchService} from './search.service';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {limitToPipe} from './limitTo.pipe';
import {setHighlighted} from 'hslayers-ng/common/extensions';

/**
 * Add search results template to page
 */
@Component({
  selector: 'hs-search-results',
  templateUrl: './search-results.component.html',
  standalone: true,
  imports: [limitToPipe, NgClass, TranslateCustomPipe, KeyValuePipe],
  styles: `
    .hsl-search-result:hover {
      background-color: rgba(var(--bs-light-rgb), 1);
    }
  `,
})
export class HsSearchResultsComponent {
  searchResultsVisible: boolean;
  fcode_zoom_map: any;

  constructor(
    private hsEventBusService: HsEventBusService,
    public hsSearchService: HsSearchService,
  ) {
    this.hsEventBusService.searchResultsReceived
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.searchResultsReceived();
      });

    this.hsEventBusService.clearSearchResults
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.clear();
      });
  }

  /**
   * Handler for receiving results of search request, sends results to correct parser
   */
  searchResultsReceived(): void {
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
      .getFeatureById(featureId) as Feature;
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
