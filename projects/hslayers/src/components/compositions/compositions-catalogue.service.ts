import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
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
type pagination = {
  start?: number;
  limit?: number;
  loaded?: boolean;
  matched?;
  next?;
};

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
  paging: pagination = {
    start: 0,
    limit: 0,
    matched: 0,
  };
  recordsPerPage = 20;
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
  constructor(
    public HsMapService: HsMapService,
    public HsCompositionsService: HsCompositionsService,
    public HsLayoutService: HsLayoutService,
    public HsCommonEndpointsService: HsCommonEndpointsService,
    public HsUtilsService: HsUtilsService,
    public HsEventBusService: HsEventBusService,
    public HsDialogContainerService: HsDialogContainerService,
    public HsLaymanService: HsLaymanService
  ) {
    if (!this.paging.limit) {
      this.paging.limit = Math.ceil(
        this.recordsPerPage / this.filteredEndpointsForCompositions().length
      );
    }
    HsEventBusService.mainPanelChanges.subscribe(() => {
      if (
        this.HsLayoutService.mainpanel === 'composition_browser' ||
        this.HsLayoutService.mainpanel === 'composition'
      ) {
        this.loadCompositions();
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
            this.loadCompositions();
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
      this.loadCompositions();
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
   * @param {boolean} keepCompositions If true, all data will be erased before new requests are created
   * @param {boolean} fillPage If true, new requests will be made, to fill the whole list page
   */
  loadCompositions(keepCompositions?: boolean, fillPage?: boolean): void {
    if (this.loadCompositionsQuery) {
      this.loadCompositionsQuery.unsubscribe();
      delete this.loadCompositionsQuery;
    }
    this.HsMapService.loaded().then(() => {
      this.compositionsLoading = true;
      const observables = [];
      if (keepCompositions === undefined || !keepCompositions) {
        this.clearCompositions();
      }
      if (this.filterByOnlyMine) {
        this.onlyMineClicked();
      } else {
        if (fillPage) {
          this.filteredEndpointsForCompositions().forEach((ep: HsEndpoint) => {
            if (ep.compositionsPaging.matched > this.paging.limit) {
              observables.push(this.loadCompositionFromEndpoint(ep));
            }
          });
        } else {
          for (const endpoint of this.filteredEndpointsForCompositions()) {
            observables.push(this.loadCompositionFromEndpoint(endpoint));
          }
        }
        this.loadCompositionsQuery = forkJoin(observables).subscribe(() => {
          this.createCompositionList();
        });
      }
    });
  }
  /**
   * @public
   * @description Load list of compositions according to current filter values and pager position
   * (filter, keywords, current extent, start composition, compositions number per page). Display compositions extent in map
   * @param {HsEndpoint} ep
   */
  loadCompositionFromEndpoint(ep: HsEndpoint): Observable<any> {
    return this.HsCompositionsService.loadCompositions(ep, {
      query: this.data.query,
      sortBy: this.data.sortBy,
      filterExtent: this.filterByExtent,
      keywords: this.data.keywords,
      themes: this.data.themes,
      type: this.data.type,
      start: this.paging.start,
      limit: this.paging.limit,
    });
  }
  /**
   * @public
   * @description Creates list of compositions from all endpoints currently available
   */
  createCompositionList(): void {
    //TODO: ratio limits
    this.paging.matched = 0;
    for (const endpoint of this.filteredEndpointsForCompositions()) {
      if (endpoint.compositionsPaging.matched) {
        this.paging.matched += endpoint.compositionsPaging.matched;
      }
      if (this.arrayContainsData(endpoint.compositions)) {
        if (this.arrayContainsData(this.compositionEntries)) {
          this.compositionEntries = this.compositionEntries.concat(
            this.filterDuplicates(endpoint.compositions)
          );
        } else {
          this.compositionEntries = this.compositionEntries.concat(
            endpoint.compositions
          );
        }
      }
    }
    this.compositionsLoading = false;
    if (this.arrayContainsData(this.compositionEntries)) {
      this.checkIfPageIsFull();
    }
  }
  /**
   * @public
   * @param {any[]} responseArray Array of compositions data
   * @description Filters compositions from responseArray with the same id in already loaded compostionEntries array
   */
  filterDuplicates(responseArray: any[]): any[] {
    return responseArray.filter(
      (data) =>
        this.compositionEntries.filter((u) => u.id == data.id).length == 0
    );
  }
  /**
   * @public
   * @description Estimates if the loaded compositions list fills one full page, if not, calls the next set of compositions to be loaded until
   *  at least one page is full
   */
  checkIfPageIsFull(): void {
    let boundByLimit: boolean;
    if (
      this.compositionEntries.length < this.paging.matched &&
      this.compositionEntries.length < this.listNext
    ) {
      boundByLimit = true;
    }
    if (this.compositionEntries.length < this.listNext && boundByLimit) {
      this.paging.start += this.paging.limit;
      this.loadCompositions(true, true);
    }

    if (this.paging.matched < this.recordsPerPage) {
      this.listNext = this.paging.matched;
    }
  }
  /**
   * @public
   * @description Clears all data saved regarding loaded compositions, endpoints and paging
   */
  clearCompositions(): void {
    this.listStart = 0;
    this.paging.start = 0;
    this.listNext = this.recordsPerPage;
    this.compositionEntries = [];
    this.HsCompositionsService.resetCompositionCounter();
    this.filteredEndpointsForCompositions().forEach(
      (ep) => (ep.compositions = [])
    );
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
   * @description Requests compositions to be loaded only from layman service
   */
  loadOnlyLayman(): Observable<any> {
    this.filteredEndpointsForCompositions().forEach((ep: HsEndpoint) => {
      if (ep.type != 'layman') {
        ep.compositions = [];
        ep.compositionsPaging.matched = 0;
      }
    });
    this.clearCompositions();
    return this.loadCompositionFromEndpoint(
      this.HsLaymanService.getLaymanEndpoint()
    );
  }
  /**
   * @public
   * @description Checks if next page for pagination is available
   */
  nextPageAvailable(): boolean {
    if (
      this.listNext == this.paging.matched ||
      this.paging.matched == 0 ||
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
      this.compositionEntries.length < this.paging.matched
    ) {
      this.paging.start += this.paging.limit;
      this.loadCompositions(true);
    }
    if (this.listNext > this.paging.matched) {
      this.listNext = this.paging.matched;
    }
  }
  /**
   * @public
   * @description Trigerred after checking onlyMine checkbox
   */
  onlyMineClicked(): void {
    if (this.filterByOnlyMine) {
      const observable = this.loadOnlyLayman();
      observable.subscribe(() => {
        this.createCompositionList();
      });
    } else {
      this.loadCompositions();
    }
  }
  /**
   * @public
   * @description Filters statusmanager endpoint out from rest of the endpoints
   */
  filteredEndpointsForCompositions(): Array<HsEndpoint> {
    return this.HsCommonEndpointsService.endpoints.filter(
      (ep) => ep.type != 'statusmanager'
    );
  }
  /**
   * @public
   * @description Clears all filters set for compostion list filtering
   */
  clearFilters(): void {
    this.data.query.title = '';
    this.data.sortBy = SORTBYVALUES[0].name;
    this.data.type = TYPES[0].name;
    this.data.theme = INSPIRETHEMES[0].name;
    this.data.keywords.forEach((kw) => (kw.selected = false));
    this.data.themes.forEach((th) => (th.selected = false));
    this.loadCompositions();
  }
}
