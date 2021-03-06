import {Injectable, NgZone} from '@angular/core';

import {Observable, forkJoin} from 'rxjs';

import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsCompositionsInfoDialogComponent} from './dialogs/info-dialog.component';
import {HsCompositionsService} from './compositions.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsEndpoint} from '../../common/endpoints/endpoint.interface';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLaymanService} from '../save-map/layman.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {
  INSPIRETHEMES,
  KEYWORDS,
  SORTBYVALUES,
  TYPES,
} from './compositions-option-values';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsCatalogueService {
  compositionEntries: any[] = [];
  /**
   *List of sort by values (currently hard-coded selection),that will be applied in compositions lookup
   */
  sortByValues = SORTBYVALUES;
  /**
   * List of composition type values (currently hard-coded selection),that will be applied in compositions lookup
   */
  types = TYPES;
  /**
   * List of composition theme values (currently hard-coded selection),that will be applied in compositions lookup
   */
  inspireThemes = INSPIRETHEMES;

  data: any = {
    query: {editable: false, title: ''},
    keywords: KEYWORDS,
    sortBy: SORTBYVALUES[0],
    type: TYPES[0].name,
    themes: INSPIRETHEMES,
  };
  recordsPerPage = 20;
  matchedCompositions = 0;
  listStart = 0;
  listNext = this.recordsPerPage;
  /**
   * Store whether filter compositions by current window extent during composition search
   */
  filterByExtent = true;
  filterByOnlyMine = false;
  /**
   *
   * Store whether filter compositions by current window extent during composition search
   */
  compositionsLoading: boolean;
  loadCompositionsQuery: any;
  filteredEndpoints: HsEndpoint[];
  extentChangeSuppressed = false;
  constructor(
    public hsMapService: HsMapService,
    public hsCompositionsService: HsCompositionsService,
    public hsLayoutService: HsLayoutService,
    public hsCommonEndpointsService: HsCommonEndpointsService,
    public hsUtilsService: HsUtilsService,
    public hsEventBusService: HsEventBusService,
    public hsDialogContainerService: HsDialogContainerService,
    public hsLaymanService: HsLaymanService,
    public hsCommonLaymanService: HsCommonLaymanService,
    private _zone: NgZone
  ) {
    this.filteredEndpoints = this.getFilteredEndpointsForCompositions();
    this.hsCommonEndpointsService.endpointsFilled.subscribe(
      () =>
        (this.filteredEndpoints = this.getFilteredEndpointsForCompositions())
    );
    hsEventBusService.mainPanelChanges.subscribe(() => {
      if (
        this.hsLayoutService.mainpanel === 'composition_browser' ||
        this.hsLayoutService.mainpanel === 'composition'
      ) {
        this.loadFilteredCompositions();
        this.extentChangeSuppressed = true;
      }
    });
    const extentChangeDebouncer = {};
    this.hsEventBusService.mapExtentChanges.subscribe(
      hsUtilsService.debounce(
        () => {
          if (
            (this.hsLayoutService.mainpanel != 'composition_browser' &&
              this.hsLayoutService.mainpanel != 'composition') ||
            this.extentChangeSuppressed
          ) {
            this.extentChangeSuppressed = false;
            return;
          }
          if (this.filterByExtent) {
            this._zone.run(() => {
              this.loadFilteredCompositions();
            });
          }
        },
        400,
        false,
        extentChangeDebouncer
      )
    );

    this.hsEventBusService.compositionDeletes.subscribe((composition) => {
      //TODO: rewrite
      const deleteDialog = this.hsLayoutService.contentWrapper.querySelector(
        '.hs-composition-delete-dialog'
      );
      if (deleteDialog) {
        deleteDialog.parentNode.remove(deleteDialog);
      }
      this._zone.run(() => {
        this.loadFilteredCompositions();
      });
    });

    this.hsCompositionsService.compositionNotFoundAtUrl.subscribe((error) => {
      this.hsDialogContainerService.create(HsCompositionsInfoDialogComponent, {
        info: {
          title: 'Composition not found',
          abstract: error.message,
        },
      });
    });

    this.hsCommonLaymanService.authChange.subscribe(() => {
      if (
        this.hsLayoutService.mainpanel != 'composition_browser' &&
        this.hsLayoutService.mainpanel != 'composition'
      ) {
        return;
      }
      this.loadFilteredCompositions();
    });
  }
  /**
   * Load list of compositions for all endpoints
   * @param createRequestLimits If true, create request limits for endpoints
   * @param suspendLimitCalculation
   */
  loadCompositions(suspendLimitCalculation?: boolean): void {
    if (this.loadCompositionsQuery) {
      this.loadCompositionsQuery.unsubscribe();
      delete this.loadCompositionsQuery;
    }
    this.clearLoadedData();
    this.compositionsLoading = true;
    this.hsMapService.loaded().then(() => {
      const observables = [];
      for (const endpoint of this.filteredEndpoints) {
        observables.push(this.loadCompositionFromEndpoint(endpoint));
      }
      this.loadCompositionsQuery = forkJoin(observables).subscribe(() => {
        suspendLimitCalculation
          ? this.createCompositionList()
          : this.calculateEndpointLimits();
      });
    });
  }
  /**
   * Calculates each endpoint compostion request limit, based on the matched compostions ratio
   * from all endpoint matched compostions
   */
  calculateEndpointLimits(): void {
    this.matchedCompositions = 0;
    this.recordsPerPage = 20;
    this.filteredEndpoints = this.getFilteredEndpointsForCompositions().filter(
      (ep) => ep.compositionsPaging.matched != 0
    );
    if (this.filteredEndpoints.length == 0) {
      this.compositionsLoading = false;
      return;
    }
    this.filteredEndpoints.forEach(
      (ep) => (this.matchedCompositions += ep.compositionsPaging.matched)
    );
    let sumLimits = 0;
    this.filteredEndpoints.forEach((ep) => {
      ep.compositionsPaging.limit = Math.floor(
        (ep.compositionsPaging.matched / this.matchedCompositions) *
          this.recordsPerPage
      );
      if (ep.compositionsPaging.limit == 0) {
        ep.compositionsPaging.limit = 1;
      }
      sumLimits += ep.compositionsPaging.limit;
    });
    this.recordsPerPage = sumLimits;
    this.loadCompositions(true);
  }
  /**
   * Load list of compositions according to current filter values and pager position
   * (filter, keywords, current extent, start composition, compositions number per page). Display compositions extent in map
   * @param ep
   */
  loadCompositionFromEndpoint(ep: HsEndpoint): Observable<any> {
    return this.hsCompositionsService.loadCompositions(ep, {
      query: this.data.query,
      sortBy: this.data.sortBy.value,
      filterByExtent: this.filterByExtent,
      keywords: this.data.keywords,
      themes: this.data.themes,
      type: this.data.type,
      start: ep.compositionsPaging.start,
      limit: ep.compositionsPaging.limit,
      filterByOnlyMine: this.filterByOnlyMine,
    });
  }
  /**
   * Clear all loaded data and filter endpoint array (if required) before loading compositions
   */
  loadFilteredCompositions(): void {
    this.clearListCounters();
    this.filteredEndpoints = this.getFilteredEndpointsForCompositions().filter(
      (ep: HsEndpoint) => {
        if (this.filterByOnlyMine) {
          return !this.filterByOnlyMine || ep.type == 'layman';
        } else {
          return true;
        }
      }
    );
    this.loadCompositions();
  }
  /**
   * Creates list of compositions from all endpoints currently available
   */
  createCompositionList(): void {
    for (const endpoint of this.filteredEndpoints) {
      this.arrayContainsData(this.compositionEntries)
        ? this.filterDuplicates(endpoint)
        : (this.compositionEntries = this.compositionEntries.concat(
            endpoint.compositions
          ));
    }
    this.compositionsLoading = false;
    if (this.matchedCompositions < this.recordsPerPage) {
      this.listNext = this.matchedCompositions;
    }
  }
  /**
   * @param responseArray Array of compositions data
   *  Filters compositions from responseArray with the same id in already loaded compostionEntries array
   * @param endpoint
   */
  filterDuplicates(endpoint: HsEndpoint): void {
    if (!this.arrayContainsData(endpoint.compositions)) {
      return;
    }
    const filteredCompositions = endpoint.compositions.filter(
      (data) =>
        this.compositionEntries.filter((u) => u.id == data.id).length == 0
    );
    this.matchedCompositions -=
      endpoint.compositions.length - filteredCompositions.length;
    this.compositionEntries = this.compositionEntries.concat(
      filteredCompositions
    );
  }
  /**
   * Clears all list counters regarding paging
   */
  clearListCounters(): void {
    this.listStart = 0;
    this.listNext = this.recordsPerPage;
    this.hsCompositionsService.resetCompositionCounter();
  }
  /**
   * Clears all data saved regarding loaded compositions
   */
  clearLoadedData(): void {
    this.compositionEntries = [];
    this.filteredEndpoints.forEach((ep) => (ep.compositions = []));
  }
  /**
   
   * Evaluates if array is defined and contains any data
   * @param arr
   */
  arrayContainsData(arr: any[]): boolean {
    if (arr !== undefined && arr.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Checks if next page for pagination is available
   */
  nextPageAvailable(): boolean {
    if (
      this.listNext == this.matchedCompositions ||
      this.matchedCompositions == 0
    ) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * Load previous list of compositions to display on pager
   */
  getPreviousCompositions(): void {
    if (this.listStart - this.recordsPerPage <= 0) {
      this.listStart = 0;
      this.listNext = this.recordsPerPage;
      this.filteredEndpoints.forEach(
        (ep: HsEndpoint) => (ep.compositionsPaging.start = 0)
      );
    } else {
      this.listStart -= this.recordsPerPage;
      this.listNext = this.listStart + this.recordsPerPage;
      this.filteredEndpoints.forEach(
        (ep: HsEndpoint) =>
          (ep.compositionsPaging.start -= ep.compositionsPaging.limit)
      );
    }
    this.loadCompositions(true);
  }

  /**
   * Load next list of compositions to display on pager
   */
  getNextCompositions(): void {
    this.listStart += this.recordsPerPage;
    this.listNext += this.recordsPerPage;
    if (this.listNext > this.matchedCompositions) {
      this.listNext = this.matchedCompositions;
    }
    this.filteredEndpoints.forEach(
      (ep) => (ep.compositionsPaging.start += ep.compositionsPaging.limit)
    );
    this.loadCompositions(true);
  }

  /**
   * Filters statusmanager endpoint out from rest of the endpoints
   */
  getFilteredEndpointsForCompositions(): HsEndpoint[] {
    return this.hsCommonEndpointsService.endpoints.filter(
      (ep) => ep.type != 'statusmanager'
    );
  }
  /**
   * Clears all filters set for compostion list filtering
   */
  clearFilters(): void {
    this.data.query.title = '';
    this.data.sortBy = SORTBYVALUES[0];
    this.data.type = TYPES[0].name;
    this.data.keywords.forEach((kw) => (kw.selected = false));
    this.data.themes.forEach((th) => (th.selected = false));
    this.filteredEndpoints.push(this.hsLaymanService.getLaymanEndpoint());
    this.loadFilteredCompositions();
  }
}
