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

export class HsCompositionsCatalogueParams {
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
}
@Injectable({
  providedIn: 'root',
})
export class HsCompositionsCatalogueService {
  apps: {
    [id: string]: HsCompositionsCatalogueParams;
  } = {default: new HsCompositionsCatalogueParams()};
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
    this.hsCommonEndpointsService.endpointsFilled.subscribe((filled) => {
      if (filled?.app) {
        this.get(filled.app).filteredEndpoints =
          this.getFilteredEndpointsForCompositions();
      }
    });
    this.hsEventBusService.mainPanelChanges.subscribe(({which, app}) => {
      if (
        this.hsLayoutService.get(app).mainpanel === 'composition_browser' ||
        this.hsLayoutService.get(app).mainpanel === 'composition'
      ) {
        this.loadFilteredCompositions(app);
        this.get(app).extentChangeSuppressed = true;
      }
    });
    const extentChangeDebouncer = {};
    this.hsEventBusService.mapExtentChanges.subscribe(
      hsUtilsService.debounce(
        ({e, app}) => {
          if (
            (this.hsLayoutService.get(app).mainpanel != 'composition_browser' &&
              this.hsLayoutService.get(app).mainpanel != 'composition') ||
            this.get(app).extentChangeSuppressed
          ) {
            this.get(app).extentChangeSuppressed = false;
            return;
          }
          if (this.get(app).filterByExtent) {
            this._zone.run(() => {
              this.loadFilteredCompositions(app);
            });
          }
        },
        400,
        false,
        extentChangeDebouncer
      )
    );

    this.hsEventBusService.compositionDeletes.subscribe(
      ({composition, app}) => {
        //TODO: rewrite
        const deleteDialog = this.hsLayoutService
          .get(app)
          .contentWrapper.querySelector('.hs-composition-delete-dialog');
        if (deleteDialog) {
          deleteDialog.parentNode.remove(deleteDialog);
        }
        this._zone.run(() => {
          this.loadFilteredCompositions(app);
        });
      }
    );

    this.hsCommonLaymanService.authChange.subscribe(({endpoint, app}) => {
      if (
        this.hsLayoutService.get(app).mainpanel != 'composition_browser' &&
        this.hsLayoutService.get(app).mainpanel != 'composition'
      ) {
        return;
      }
      this.loadFilteredCompositions(app);
    });
  }

  init(app: string): void {
    this.get(app).filteredEndpoints =
      this.getFilteredEndpointsForCompositions();
    this.hsCompositionsService
      .get(app)
      .compositionNotFoundAtUrl.subscribe((data) => {
        this.hsDialogContainerService.create(
          HsCompositionsInfoDialogComponent,
          {
            info: {
              title: this.hsCompositionsService.translateString(
                'COMPOSITIONS',
                'compositionNotFound',
                app
              ),
              abstract: data.error.message,
            },
          },
          data.app
        );
      });
  }
  get(app: string): HsCompositionsCatalogueParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsCompositionsCatalogueParams();
    }
    return this.apps[app ?? 'default'];
  }
  /**
   * Load list of compositions for all endpoints
   * @param suspendLimitCalculation -
   */
  loadCompositions(app: string, suspendLimitCalculation?: boolean): void {
    if (this.get(app).loadCompositionsQuery) {
      this.get(app).loadCompositionsQuery.unsubscribe();
      delete this.get(app).loadCompositionsQuery;
    }
    this.clearLoadedData(app);
    this.get(app).dataLoading = true;
    this.hsMapService.loaded(app).then(() => {
      const observables = [];
      for (const endpoint of this.get(app).filteredEndpoints) {
        observables.push(this.loadCompositionFromEndpoint(endpoint, app));
      }
      this.get(app).loadCompositionsQuery = forkJoin(observables).subscribe(
        () => {
          suspendLimitCalculation
            ? this.createCompositionList(app)
            : this.calculateEndpointLimits(app);
        }
      );
    });
  }
  /**
   * Calculates each endpoint composition request limit, based on the matched compositions ratio
   * from all endpoint matched compositions
   */
  calculateEndpointLimits(app: string): void {
    this.get(app).matchedRecords = 0;
    this.get(app).filteredEndpoints =
      this.getFilteredEndpointsForCompositions().filter(
        (ep) => ep.compositionsPaging.matched != 0
      );
    if (this.get(app).filteredEndpoints.length == 0) {
      this.get(app).dataLoading = false;
      return;
    }
    this.get(app).filteredEndpoints.forEach(
      (ep) => (this.get(app).matchedRecords += ep.compositionsPaging.matched)
    );
    let sumLimits = 0;
    this.get(app).filteredEndpoints.forEach((ep) => {
      ep.compositionsPaging.limit = Math.floor(
        (ep.compositionsPaging.matched / this.get(app).matchedRecords) *
          this.get(app).recordsPerPage
      );
      if (ep.compositionsPaging.limit == 0) {
        ep.compositionsPaging.limit = 1;
      }
      sumLimits += ep.compositionsPaging.limit;
    });
    this.get(app).recordsPerPage = sumLimits;
    this.get(app).listNext = this.get(app).recordsPerPage;
    this.loadCompositions(app, true);
  }
  /**
   * Load list of compositions according to current filter values and pager position
   * (filter, keywords, current extent, start composition, compositions number per page). Display compositions extent in map
   * @param ep -
   */
  loadCompositionFromEndpoint(ep: HsEndpoint, app: string): Observable<any> {
    return this.hsCompositionsService.loadCompositions(
      ep,
      {
        query: this.get(app).data.query,
        sortBy: this.get(app).data.sortBy.value,
        filterByExtent: this.get(app).filterByExtent,
        keywords: this.get(app).data.keywords,
        themes: this.get(app).data.themes,
        type: this.get(app).data.type,
        start: ep.compositionsPaging.start,
        limit: ep.compositionsPaging.limit,
        filterByOnlyMine: this.get(app).filterByOnlyMine,
      },
      app
    );
  }
  /**
   * Clear all loaded data and filter endpoint array (if required) before loading compositions
   */
  loadFilteredCompositions(app: string): void {
    this.clearListCounters(app);
    this.get(app).filteredEndpoints =
      this.getFilteredEndpointsForCompositions().filter((ep: HsEndpoint) => {
        if (this.get(app).filterByOnlyMine) {
          return !this.get(app).filterByOnlyMine || ep.type == 'layman';
        } else {
          return true;
        }
      });
    this.loadCompositions(app);
  }
  /**
   * Creates list of compositions from all endpoints currently available
   */
  createCompositionList(app: string): void {
    for (const endpoint of this.get(app).filteredEndpoints) {
      this.arrayContainsData(this.get(app).compositionEntries)
        ? this.filterDuplicates(endpoint, app)
        : (this.get(app).compositionEntries = this.get(
            app
          ).compositionEntries.concat(endpoint.compositions));
    }
    this.get(app).dataLoading = false;
    if (this.get(app).matchedRecords < this.get(app).recordsPerPage) {
      this.get(app).listNext = this.get(app).matchedRecords;
    }
  }
  /**
   *  Filters compositions from responseArray with the same id in already loaded compositionEntries array
   * @param endpoint -
   */
  filterDuplicates(endpoint: HsEndpoint, app: string): void {
    if (!this.arrayContainsData(endpoint.compositions)) {
      return;
    }
    const filteredCompositions = endpoint.compositions.filter(
      (data) =>
        this.get(app).compositionEntries.filter((u) => u.id == data.id)
          .length == 0
    );
    this.get(app).matchedRecords -=
      endpoint.compositions.length - filteredCompositions.length;
    this.get(app).compositionEntries =
      this.get(app).compositionEntries.concat(filteredCompositions);
  }
  /**
   * Clears all list counters regarding paging
   */
  clearListCounters(app: string): void {
    this.get(app).listStart = 0;
    this.get(app).listNext = this.get(app).recordsPerPage;
    this.hsCompositionsService.resetCompositionCounter(app);
  }
  /**
   * Clears all data saved regarding loaded compositions
   */
  clearLoadedData(app: string): void {
    this.get(app).compositionEntries = [];
    this.get(app).filteredEndpoints.forEach((ep) => (ep.compositions = []));
  }
  /**
   
   * Evaluates if array is defined and contains any data
   * @param arr -
   */
  arrayContainsData(arr: any[]): boolean {
    if (arr !== undefined && arr.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Load previous list of compositions to display on pager
   */
  getPreviousRecords(app: string): void {
    if (this.get(app).listStart - this.get(app).recordsPerPage <= 0) {
      this.get(app).listStart = 0;
      this.get(app).listNext = this.get(app).recordsPerPage;
      this.get(app).filteredEndpoints.forEach(
        (ep: HsEndpoint) => (ep.compositionsPaging.start = 0)
      );
    } else {
      this.get(app).listStart -= this.get(app).recordsPerPage;
      this.get(app).listNext =
        this.get(app).listStart + this.get(app).recordsPerPage;
      this.get(app).filteredEndpoints.forEach(
        (ep: HsEndpoint) =>
          (ep.compositionsPaging.start -= ep.compositionsPaging.limit)
      );
    }
    this.loadCompositions(app, true);
  }

  /**
   * Load next list of compositions to display on pager
   */
  getNextRecords(app: string): void {
    this.get(app).listStart += this.get(app).recordsPerPage;
    this.get(app).listNext += this.get(app).recordsPerPage;
    if (this.get(app).listNext > this.get(app).matchedRecords) {
      this.get(app).listNext = this.get(app).matchedRecords;
    }
    this.get(app).filteredEndpoints.forEach(
      (ep) => (ep.compositionsPaging.start += ep.compositionsPaging.limit)
    );
    this.loadCompositions(app, true);
  }

  changeRecordsPerPage(app: string): void {
    this.clearListCounters(app);
    this.loadCompositions(app);
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
  clearFilters(app: string): void {
    this.get(app).data.query.title = '';
    this.get(app).data.sortBy = SORTBYVALUES[0];
    this.get(app).data.type = TYPES[0].name;
    this.get(app).data.keywords.forEach((kw) => (kw.selected = false));
    this.get(app).data.themes.forEach((th) => (th.selected = false));
    this.get(app).filteredEndpoints.push(
      this.hsLaymanService.getLaymanEndpoint()
    );
    this.loadFilteredCompositions(app);
  }
}
