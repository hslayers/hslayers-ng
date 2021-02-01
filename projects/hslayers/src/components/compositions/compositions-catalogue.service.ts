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
import {Injectable} from '@angular/core';
import {Observable, forkJoin} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsCatalogueService {
  compositionEntries: any[] = [];
  /**
   * @public
   * @type {object}
   * @description List of sort by values (currently hard-coded selection),that will be applied in compositions lookup
   */
  sortByValues = SORTBYVALUES;
  /**
   * @public
   * @type {object}
   * @description List of composition type values (currently hard-coded selection),that will be applied in compositions lookup
   */
  types = TYPES;
  /**
   * @public
   * @type {object}
   * @description List of composition theme values (currently hard-coded selection),that will be applied in compositions lookup
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
   * @public
   * @type {boolean} true
   * @description Store whether filter compositions by current window extent during composition search
   */
  filterByExtent = true;
  filterByOnlyMine = false;
  /**
   * @public
   * @type {boolean} true
   * @description Store whether filter compositions by current window extent during composition search
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
    public HsCommonLaymanService: HsCommonLaymanService
  ) {
    this.filteredEndpoints = this.getFilteredEndpointsForCompositions();
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
            this.loadFilteredCompositions();
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
      this.loadFilteredCompositions();
    });

    this.HsCompositionsService.compositionNotFoundAtUrl.subscribe((error) => {
      this.HsDialogContainerService.create(HsCompositionsInfoDialogComponent, {
        info: {
          title: 'Composition not found',
          abstract: error.message,
        },
      });
    });
  }
  /**
   * @public
   * @description Load list of compositions for all endpoints
   * @param {boolean} createRequestLimits If true, create request limits for endpoints
   */
  loadCompositions(suspendReset?: boolean): void {
    if (this.loadCompositionsQuery) {
      this.loadCompositionsQuery.unsubscribe();
      delete this.loadCompositionsQuery;
    }
    this.compositionsLoading = true;
    this.HsMapService.loaded().then(() => {
      const observables = [];
      for (const endpoint of this.filteredEndpoints) {
        observables.push(
          this.loadCompositionFromEndpoint(endpoint, suspendReset)
        );
      }
      this.loadCompositionsQuery = forkJoin(observables).subscribe(() => {
        suspendReset
          ? this.createCompositionList()
          : this.calculateEndpointLimits();
      });
    });
  }
  calculateEndpointLimits(): void {
    this.matchedCompositions = 0;
    this.filteredEndpoints = this.getFilteredEndpointsForCompositions().filter(
      (ep) => ep.compositionsPaging.matched != 0
    );
    if (this.filteredEndpoints.length == 0) {
      return;
    }
    this.filteredEndpoints.forEach(
      (ep) => (this.matchedCompositions += ep.compositionsPaging.matched)
    );
    this.filteredEndpoints.forEach((ep) => {
      ep.compositionsPaging.limit = Math.floor(
        (ep.compositionsPaging.matched / this.matchedCompositions) *
          this.recordsPerPage
      );
      if (ep.compositionsPaging.limit == 0) {
        ep.compositionsPaging.limit = 1;
      }
    });
    this.loadCompositions(true);
  }
  /**
   * @public
   * @description Load list of compositions according to current filter values and pager position
   * (filter, keywords, current extent, start composition, compositions number per page). Display compositions extent in map
   * @param {HsEndpoint} ep
   */
  loadCompositionFromEndpoint(
    ep: HsEndpoint,
    keepExtentLayer?: boolean
  ): Observable<any> {
    return this.HsCompositionsService.loadCompositions(
      ep,
      {
        query: this.data.query,
        sortBy: this.data.sortBy,
        filterExtent: this.filterByExtent,
        keywords: this.data.keywords,
        themes: this.data.themes,
        type: this.data.type,
        start: ep.compositionsPaging.start,
        limit: ep.compositionsPaging.limit,
      },
      keepExtentLayer
    );
  }
  loadFilteredCompositions(): void {
    this.clearCompositions();
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
   * @public
   * @description Creates list of compositions from all endpoints currently available
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
   * @public
   * @param responseArray Array of compositions data
   * @description Filters compositions from responseArray with the same id in already loaded compostionEntries array
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
   * @public
   * @description Clears all data saved regarding loaded compositions, endpoints and paging
   */
  clearCompositions(): void {
    this.listStart = 0;
    this.listNext = this.recordsPerPage;
    this.compositionEntries = [];
    this.HsCompositionsService.resetCompositionCounter();
    this.filteredEndpoints.forEach((ep) => (ep.compositions = []));
  }
  /**
   * @public
   * @description Evaluates if array is defined and contains any data
   * @param {any[]} arr
   */
  arrayContainsData(arr: any[]): boolean {
    if (arr !== undefined && arr.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * @public
   * @description Checks if next page for pagination is available
   */
  nextPageAvailable(): boolean {
    if (
      this.listNext == this.matchedCompositions ||
      this.matchedCompositions == 0 ||
      this.compositionEntries.length < this.recordsPerPage
    ) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * @public
   * @description Load previous list of compositions to display on pager
   */
  getPreviousCompositions(): void {
    if (this.listStart - this.recordsPerPage < 0) {
      this.listStart = 0;
      this.listNext = this.recordsPerPage;
    } else {
      this.listStart -= this.recordsPerPage;
      this.listNext = this.listStart + this.recordsPerPage;
    }
  }

  /**
   * @public
   * @description Load next list of compositions to display on pager
   */
  getNextCompositions(): void {
    this.listStart += this.recordsPerPage;
    this.listNext += this.recordsPerPage;
    if (
      this.listNext > this.compositionEntries.length &&
      this.compositionEntries.length < this.matchedCompositions
    ) {
      this.filteredEndpoints.forEach(
        (ep) => (ep.compositionsPaging.start += ep.compositionsPaging.limit)
      );
      this.loadCompositions(true);
    }
    if (this.listNext > this.matchedCompositions) {
      this.listNext = this.matchedCompositions;
    }
  }

  /**
   * @public
   * @description Filters statusmanager endpoint out from rest of the endpoints
   */
  getFilteredEndpointsForCompositions(): HsEndpoint[] {
    return this.HsCommonEndpointsService.endpoints.filter(
      (ep) => ep.type != 'statusmanager'
    );
  }
  /**
   * @public
   * @description Clears all filters set for compostion list filtering
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
