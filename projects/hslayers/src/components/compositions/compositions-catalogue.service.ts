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

export class HsCompositionsCatalogueParams {
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
        ({map, event, extent, app}) => {
          const appRef = this.get(app);
          if (
            (this.hsLayoutService.get(app).mainpanel != 'composition_browser' &&
              this.hsLayoutService.get(app).mainpanel != 'composition') ||
            appRef.extentChangeSuppressed
          ) {
            appRef.extentChangeSuppressed = false;
            return;
          }
          if (appRef.filterByExtent) {
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

  /**
   * Initialize compositions catalogue service data and subscribers
   * @param app - App identifier
   */
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
    const appRef = this.get(app);
    if (appRef.loadCompositionsQuery) {
      appRef.loadCompositionsQuery.unsubscribe();
      delete appRef.loadCompositionsQuery;
    }
    this.clearLoadedData(app);
    appRef.dataLoading = true;
    this.hsMapService.loaded(app).then(() => {
      const observables = [];
      for (const endpoint of appRef.filteredEndpoints) {
        observables.push(this.loadCompositionFromEndpoint(endpoint, app));
      }
      appRef.loadCompositionsQuery = forkJoin(observables).subscribe(() => {
        suspendLimitCalculation
          ? this.createCompositionList(app)
          : this.calculateEndpointLimits(app);
      });
    });
  }
  /**
   * Calculates each endpoint composition request limit, based on the matched compositions ratio
   * from all endpoint matched compositions
   */
  calculateEndpointLimits(app: string): void {
    const appRef = this.get(app);
    appRef.matchedRecords = 0;
    appRef.filteredEndpoints =
      this.getFilteredEndpointsForCompositions().filter(
        (ep) => ep.compositionsPaging.matched != 0
      );
    if (appRef.filteredEndpoints.length == 0) {
      appRef.dataLoading = false;
      return;
    }
    appRef.filteredEndpoints.forEach(
      (ep) => (appRef.matchedRecords += ep.compositionsPaging.matched)
    );
    let sumLimits = 0;
    appRef.filteredEndpoints.forEach((ep) => {
      ep.compositionsPaging.limit = Math.floor(
        (ep.compositionsPaging.matched / appRef.matchedRecords) *
          appRef.recordsPerPage
      );
      if (ep.compositionsPaging.limit == 0) {
        ep.compositionsPaging.limit = 1;
      }
      sumLimits += ep.compositionsPaging.limit;
    });
    appRef.recordsPerPage = sumLimits;
    appRef.listNext = appRef.recordsPerPage;
    this.loadCompositions(app, true);
  }
  /**
   * Load list of compositions according to current filter values and pager position
   * (filter, keywords, current extent, start composition, compositions number per page). Display compositions extent in map
   * @param ep -
   */
  loadCompositionFromEndpoint(ep: HsEndpoint, app: string): Observable<any> {
    const appRef = this.get(app);
    return this.hsCompositionsService.loadCompositions(
      ep,
      {
        query: appRef.data.query,
        sortBy: appRef.data.sortBy.value,
        filterByExtent: appRef.filterByExtent,
        keywords: appRef.data.keywords,
        themes: appRef.data.themes,
        type: appRef.data.type,
        start: ep.compositionsPaging.start,
        limit: ep.compositionsPaging.limit,
        filterByOnlyMine: appRef.filterByOnlyMine,
      },
      app
    );
  }
  /**
   * Clear all loaded data and filter endpoint array (if required) before loading compositions
   */
  loadFilteredCompositions(app: string): void {
    const appRef = this.get(app);
    this.clearListCounters(app);
    appRef.filteredEndpoints =
      this.getFilteredEndpointsForCompositions().filter((ep: HsEndpoint) => {
        if (appRef.filterByOnlyMine) {
          return !appRef.filterByOnlyMine || ep.type.includes('layman');
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
    const appRef = this.get(app);
    for (const endpoint of appRef.filteredEndpoints) {
      this.arrayContainsData(appRef.compositionEntries)
        ? this.filterDuplicates(endpoint, app)
        : (appRef.compositionEntries = appRef.compositionEntries.concat(
            endpoint.compositions
          ));
    }
    appRef.dataLoading = false;
    if (appRef.matchedRecords < appRef.recordsPerPage) {
      appRef.listNext = appRef.matchedRecords;
    }
  }
  /**
   *  Filters compositions from responseArray with the same id in already loaded compositionEntries array
   * @param endpoint -
   */
  filterDuplicates(endpoint: HsEndpoint, app: string): void {
    const appRef = this.get(app);
    if (!this.arrayContainsData(endpoint.compositions)) {
      return;
    }
    const filteredCompositions = endpoint.compositions.filter(
      (record) =>
        appRef.compositionEntries.filter(
          (loaded) =>
            loaded.id == record.id ||
            'm-' + loaded.id == record.id ||
            loaded.id == 'm-' + record.id
        ).length == 0
    );
    appRef.matchedRecords -=
      endpoint.compositions.length - filteredCompositions.length;
    appRef.compositionEntries =
      appRef.compositionEntries.concat(filteredCompositions);
  }
  /**
   * Clears all list counters regarding paging
   */
  clearListCounters(app: string): void {
    const appRef = this.get(app);
    appRef.listStart = 0;
    appRef.listNext = appRef.recordsPerPage;
    this.hsCompositionsService.resetCompositionCounter();
  }
  /**
   * Clears all data saved regarding loaded compositions
   */
  clearLoadedData(app: string): void {
    const appRef = this.get(app);
    appRef.compositionEntries = [];
    appRef.filteredEndpoints.forEach((ep) => (ep.compositions = []));
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
  getPreviousRecords(app: string): void {
    const appRef = this.get(app);
    if (appRef.listStart - appRef.recordsPerPage <= 0) {
      appRef.listStart = 0;
      appRef.listNext = appRef.recordsPerPage;
      appRef.filteredEndpoints.forEach(
        (ep: HsEndpoint) => (ep.compositionsPaging.start = 0)
      );
    } else {
      appRef.listStart -= appRef.recordsPerPage;
      appRef.listNext = appRef.listStart + appRef.recordsPerPage;
      appRef.filteredEndpoints.forEach(
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
    const appRef = this.get(app);
    appRef.listStart += appRef.recordsPerPage;
    appRef.listNext += appRef.recordsPerPage;
    if (appRef.listNext > appRef.matchedRecords) {
      appRef.listNext = appRef.matchedRecords;
    }
    appRef.filteredEndpoints.forEach(
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
    const appRef = this.get(app);
    appRef.data.query.title = '';
    appRef.data.sortBy = SORTBYVALUES[0];
    appRef.data.type = TYPES[0].name;
    appRef.data.keywords.forEach((kw) => (kw.selected = false));
    appRef.data.themes.forEach((th) => (th.selected = false));
    const laymanEndpoint = this.hsCommonLaymanService.layman;
    if (laymanEndpoint) {
      appRef.filteredEndpoints.push(laymanEndpoint);
    }
    this.loadFilteredCompositions(app);
  }
}
