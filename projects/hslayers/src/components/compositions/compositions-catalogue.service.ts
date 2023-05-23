import {Injectable, NgZone} from '@angular/core';

import {Observable, forkJoin} from 'rxjs';

import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsCompositionsInfoDialogComponent} from './dialogs/info-dialog.component';
import {HsCompositionsService} from './compositions.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsEndpoint} from '../../common/endpoints/endpoint.interface';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapCompositionDescriptor} from './models/composition-descriptor.model';
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
  compositionEntries: HsMapCompositionDescriptor[] = [];
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
  matchedRecords = 0;
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
  dataLoading: boolean;
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
    public hsCommonLaymanService: HsCommonLaymanService,
    private _zone: NgZone
  ) {
    this.hsCommonEndpointsService.endpointsFilled.subscribe((endpoints) => {
      this.filteredEndpoints = this.getFilteredEndpointsForCompositions();
    });
    this.hsEventBusService.mainPanelChanges.subscribe((which) => {
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
        ({map, event, extent}) => {
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

    this.hsCommonLaymanService.authChange.subscribe((endpoint) => {
      if (
        this.hsLayoutService.mainpanel != 'composition_browser' &&
        this.hsLayoutService.mainpanel != 'composition'
      ) {
        return;
      }
      this.loadFilteredCompositions();
    });

    this.filteredEndpoints = this.getFilteredEndpointsForCompositions();
    this.hsCompositionsService.compositionNotFoundAtUrl.subscribe((data) => {
      this.hsDialogContainerService.create(HsCompositionsInfoDialogComponent, {
        info: {
          title: this.hsCompositionsService.translateString(
            'COMPOSITIONS',
            'compositionNotFound'
          ),
          abstract: data.error.message,
        },
      });
    });
  }

  /**
   * Load list of compositions for all endpoints
   * @param suspendLimitCalculation -
   */
  loadCompositions(suspendLimitCalculation?: boolean): void {
    if (this.loadCompositionsQuery) {
      this.loadCompositionsQuery.unsubscribe();
      delete this.loadCompositionsQuery;
    }
    this.clearLoadedData();
    this.dataLoading = true;
    this.hsMapService.loaded().then(() => {
      const observables: Observable<any>[] = [];
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
   * Calculates each endpoint composition request limit, based on the matched compositions ratio
   * from all endpoint matched compositions
   */
  calculateEndpointLimits(): void {
    this.matchedRecords = 0;
    this.filteredEndpoints = this.getFilteredEndpointsForCompositions().filter(
      (ep) => ep.compositionsPaging.matched != 0
    );
    if (this.filteredEndpoints.length == 0) {
      this.dataLoading = false;
      return;
    }
    this.filteredEndpoints.forEach(
      (ep) => (this.matchedRecords += ep.compositionsPaging.matched)
    );
    let sumLimits = 0;
    this.filteredEndpoints.forEach((ep) => {
      ep.compositionsPaging.limit = Math.floor(
        (ep.compositionsPaging.matched / this.matchedRecords) *
          this.recordsPerPage
      );
      if (ep.compositionsPaging.limit == 0) {
        ep.compositionsPaging.limit = 1;
      }
      sumLimits += ep.compositionsPaging.limit;
    });
    this.recordsPerPage = sumLimits;
    this.listNext = this.recordsPerPage;
    this.loadCompositions(true);
  }
  /**
   * Load list of compositions according to current filter values and pager position
   * (filter, keywords, current extent, start composition, compositions number per page). Display compositions extent in map
   * @param ep -
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
          return !this.filterByOnlyMine || ep.type.includes('layman');
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
    this.dataLoading = false;
    if (this.matchedRecords < this.recordsPerPage) {
      this.listNext = this.matchedRecords;
    }
  }
  /**
   *  Filters compositions from responseArray with the same id in already loaded compositionEntries array
   * @param endpoint -
   */
  filterDuplicates(endpoint: HsEndpoint): void {
    if (!this.arrayContainsData(endpoint.compositions)) {
      return;
    }
    const filteredCompositions = endpoint.compositions.filter(
      (record) =>
        this.compositionEntries.filter(
          (loaded) =>
            loaded.id == record.id ||
            'm-' + loaded.id == record.id ||
            loaded.id == 'm-' + record.id
        ).length == 0
    );
    this.matchedRecords -=
      endpoint.compositions.length - filteredCompositions.length;
    this.compositionEntries =
      this.compositionEntries.concat(filteredCompositions);
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
   * @param arr - Endpoint composition records
   */
  arrayContainsData(arr: any[]): boolean {
    return arr !== undefined && arr.length > 0;
  }

  /**
   * Load previous list of compositions to display on pager
   */
  getPreviousRecords(): void {
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
  getNextRecords(): void {
    this.listStart += this.recordsPerPage;
    this.listNext += this.recordsPerPage;
    if (this.listNext > this.matchedRecords) {
      this.listNext = this.matchedRecords;
    }
    this.filteredEndpoints.forEach(
      (ep) => (ep.compositionsPaging.start += ep.compositionsPaging.limit)
    );
    this.loadCompositions(true);
  }

  changeRecordsPerPage(): void {
    this.clearListCounters();
    this.loadCompositions();
  }

  /**
   * Filters statusmanager endpoint out from rest of the endpoints
   */
  getFilteredEndpointsForCompositions(): HsEndpoint[] {
    if (this.hsCommonEndpointsService.endpoints == undefined) {
      return [];
    }
    return this.hsCommonEndpointsService.endpoints.filter(
      (ep) => ep.type != 'statusmanager'
    );
  }
  /**
   * Clears all filters set for composition list filtering
   */
  clearFilters(): void {
    this.data.query.title = '';
    this.data.sortBy = SORTBYVALUES[0];
    this.data.type = TYPES[0].name;
    this.data.keywords.forEach((kw) => (kw.selected = false));
    this.data.themes.forEach((th) => (th.selected = false));
    const laymanEndpoint = this.hsCommonLaymanService.layman;
    if (laymanEndpoint) {
      this.filteredEndpoints.push(laymanEndpoint);
    }
    this.loadFilteredCompositions();
  }
}
