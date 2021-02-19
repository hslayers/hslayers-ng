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
import {Injectable, NgZone} from '@angular/core';
import {Observable, forkJoin} from 'rxjs';

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
    sortBy: SORTBYVALUES[0].name,
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
  filtersActive = false;
  constructor(
    public HsMapService: HsMapService,
    public HsCompositionsService: HsCompositionsService,
    public HsLayoutService: HsLayoutService,
    public HsCommonEndpointsService: HsCommonEndpointsService,
    public HsUtilsService: HsUtilsService,
    public HsEventBusService: HsEventBusService,
    public HsDialogContainerService: HsDialogContainerService,
    public HsLaymanService: HsLaymanService,
    public HsCommonLaymanService: HsCommonLaymanService,
    private zone: NgZone
  ) {
    this.filteredEndpoints = this.getFilteredEndpointsForCompositions();
    this.HsCommonEndpointsService.endpointsFilled.subscribe(
      () =>
        (this.filteredEndpoints = this.getFilteredEndpointsForCompositions())
    );
    HsEventBusService.mainPanelChanges.subscribe(() => {
      if (
        this.HsLayoutService.mainpanel === 'composition_browser' ||
        this.HsLayoutService.mainpanel === 'composition'
      ) {
        this.loadFilteredCompositions();
      }
    });
    const extentChangeDebouncer = {};
    this.HsEventBusService.mapExtentChanges.subscribe(
      HsUtilsService.debounce(
        () => {
          if (
            this.HsLayoutService.mainpanel != 'composition_browser' &&
            this.HsLayoutService.mainpanel != 'composition'
          ) {
            return;
          }
          if (this.filterByExtent) {
            this.zone.run(() => {
              this.loadFilteredCompositions();
            });
          }
        },
        400,
        false,
        extentChangeDebouncer
      )
    );

    this.HsEventBusService.compositionDeletes.subscribe((composition) => {
      //TODO: rewrite
      const deleteDialog = this.HsLayoutService.contentWrapper.querySelector(
        '.hs-composition-delete-dialog'
      );
      if (deleteDialog) {
        deleteDialog.parentNode.remove(deleteDialog);
      }
      this.zone.run(() => {
        this.loadFilteredCompositions();
      });
    });

    this.HsCompositionsService.compositionNotFoundAtUrl.subscribe((error) => {
      this.HsDialogContainerService.create(HsCompositionsInfoDialogComponent, {
        info: {
          title: 'Composition not found',
          abstract: error.message,
        },
      });
    });

    this.HsCommonLaymanService.authChange.subscribe(() => {
      if (
        this.HsLayoutService.mainpanel != 'composition_browser' &&
        this.HsLayoutService.mainpanel != 'composition'
      ) {
        return;
      }
      this.loadFilteredCompositions();
    });
  }
  /**
   * Load list of compositions for all endpoints
   * @param createRequestLimits If true, create request limits for endpoints
   */
  loadCompositions(suspendLimitCalculation?: boolean): void {
    if (this.loadCompositionsQuery) {
      this.loadCompositionsQuery.unsubscribe();
      delete this.loadCompositionsQuery;
    }
    this.clearLoadedData();
    this.compositionsLoading = true;
    this.HsMapService.loaded().then(() => {
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
    return this.HsCompositionsService.loadCompositions(ep, {
      query: this.data.query,
      sortBy: this.data.sortBy,
      filterExtent: this.filterByExtent,
      keywords: this.data.keywords,
      themes: this.data.themes,
      type: this.data.type,
      start: ep.compositionsPaging.start,
      limit: ep.compositionsPaging.limit,
    });
  }
  /**
   * Clear all loaded data and filter endpoint array (if required) before loading compositions
   */
  loadFilteredCompositions(): void {
    this.clearListCounters();
    this.checkForActiveFilters();
    this.filteredEndpoints = this.getFilteredEndpointsForCompositions().filter(
      (ep: HsEndpoint) => {
        if (this.filtersActive && !this.filterByOnlyMine) {
          return ep.type != 'layman';
        } else if (this.filterByOnlyMine) {
          return !this.filterByOnlyMine || ep.type == 'layman';
        } else {
          return true;
        }
      }
    );
    this.loadCompositions();
  }
  /**
   * Check if any Micka filters are enabled before loading compositions
   */
  checkForActiveFilters(): void {
    let filtersFound = false;
    for (const key in this.data) {
      switch (key) {
        case 'type':
          if (this.data.type !== 'None') {
            filtersFound = true;
          }
          break;
        case 'query':
          if (this.data.query.title != '') {
            this.data.query.title = this.data.query.title.trim();
          }
          break;
        case 'themes':
        case 'keywords':
          if (this.data[key].filter((kw) => kw.selected == true).length != 0) {
            filtersFound = true;
          }
          break;
        default:
      }
    }
    this.filtersActive = filtersFound;
  }
  /**
   * Creates list of compositions from all endpoints currently available
   */
  createCompositionList(): void {
    for (const endpoint of this.filteredEndpoints) {
      if (endpoint.type == 'layman') {
        endpoint.compositions = endpoint.compositions.slice(
          endpoint.compositionsPaging.start,
          endpoint.compositionsPaging.start + endpoint.compositionsPaging.limit
        );
      }
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
   */
  filterDuplicates(endpoint: HsEndpoint): void {
    if (!this.arrayContainsData(endpoint.compositions)) {
      return;
    }
    const filteredCompositions = endpoint.compositions.filter(
      (data) =>
        this.compositionEntries.filter((u) => u.id == data.id).length == 0
    );
    if (endpoint.type != 'layman') {
      this.matchedCompositions -=
        endpoint.compositions.length - filteredCompositions.length;
    }
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
    this.HsCompositionsService.resetCompositionCounter();
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
    return this.HsCommonEndpointsService.endpoints.filter(
      (ep) => ep.type != 'statusmanager'
    );
  }
  /**
   * Clears all filters set for compostion list filtering
   */
  clearFilters(): void {
    this.filtersActive = false;
    this.data.query.title = '';
    this.data.sortBy = SORTBYVALUES[0].name;
    this.data.type = TYPES[0].name;
    this.data.theme = INSPIRETHEMES[0].name;
    this.data.keywords.forEach((kw) => (kw.selected = false));
    this.data.themes.forEach((th) => (th.selected = false));
    this.filteredEndpoints.push(this.HsLaymanService.getLaymanEndpoint());
    this.loadFilteredCompositions();
  }
}
