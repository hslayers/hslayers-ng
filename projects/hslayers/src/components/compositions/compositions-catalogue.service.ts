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
    theme: INSPIRETHEMES[0].name,
  };
  paging: pagination = {
    start: 0,
    limit: 0,
    loaded: false,
    matched: 0,
    next: 0,
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
  selectedCompId: any;
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
      this.paging.limit = Math.round(
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
   * @param keepCompositions
   */
  loadCompositions(keepCompositions?: boolean, fillPage?: boolean): void {
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
              observables.push(this.loadCompositionFromEndpointObservable(ep));
            }
          });
        } else {
          for (const endpoint of this.filteredEndpointsForCompositions()) {
            observables.push(
              this.loadCompositionFromEndpointObservable(endpoint)
            );
          }
        }
        forkJoin(observables).subscribe(() => {
          this.createCompositionList();
        });
      }
    });
    // Promise.all(promises).then(() => {
    //   this.createCompositionList();
    // });
  }
  /**
   * @public
   * @description Load list of compositions according to current filter values and pager position
   * (filter, keywords, current extent, start composition, compositions number per page). Display compositions extent in map
   * @param {HsEndpoint} ep
   */
  loadCompositionFromEndpointObservable(ep: HsEndpoint): Observable<any> {
    return this.HsCompositionsService.loadCompositions(ep, {
      query: this.data.query,
      sortBy: this.data.sortBy,
      filterExtent: this.filterByExtent,
      keywords: this.data.keywords,
      theme: this.data.theme,
      type: this.data.type,
      start: this.paging.start,
      limit: this.paging.limit,
    });
  }
  createCompositionList(): void {
    //ratio limits
    this.paging.matched = 0;
    for (const endpoint of this.filteredEndpointsForCompositions()) {
      if (endpoint.compositionsPaging.matched) {
        this.paging.matched += endpoint.compositionsPaging.matched;
      }
      if (
        endpoint.compositions !== undefined &&
        endpoint.compositions?.length > 0
      ) {
        if (this.compositionEntries?.length != 0) {
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
    this.checkIfPageIsFull();
  }
  filterDuplicates(responseArray): any[] {
    if (responseArray === undefined || responseArray?.length == 0) {
      return [];
    }
    const hasUuId = responseArray.find((comp) => {
      if (comp.uuid !== undefined) {
        return true;
      }
    });
    if (hasUuId) {
      const laymanComps = this.compositionEntries.filter(
        (comp) => comp.uuid !== undefined
      );
      if (laymanComps?.length > 0) {
        return responseArray.filter(
          (data) => laymanComps.filter((u) => u.uuid == data.uuid).length == 0
        );
        // return this.compositionEntries.concat(
        //   responseArray.filter(
        //     (data) => laymanComps.filter((u) => u.uuid != data.uuid).length == 0
        //   )
        // );
      } else {
        return responseArray;
      }
    } else {
      const regularComps = this.compositionEntries.filter(
        (comp) => comp.id !== undefined
      );
      return responseArray.filter(
        (data) => regularComps.filter((u) => u.id == data.id).length == 0
      );
    }
  }
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
  clearCompositions(): void {
    this.listStart = 0;
    this.paging.start = 0;
    this.listNext = this.recordsPerPage;
    this.compositionEntries = [];
    this.HsCompositionsService.resetCompositionCounter();
  }
  loadOnlyLayman(): Observable<any> {
    this.filteredEndpointsForCompositions().forEach((ep: HsEndpoint) => {
      if (ep.type != 'layman') {
        ep.compositions = [];
        ep.compositionsPaging.matched = 0;
      }
    });
    this.clearCompositions();
    return this.loadCompositionFromEndpointObservable(
      this.HsLaymanService.getLaymanEndpoint()
    );
  }

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

  filteredEndpointsForCompositions(): Array<HsEndpoint> {
    return this.HsCommonEndpointsService.endpoints.filter(
      (ep) => ep.type != 'statusmanager'
    );
  }
  clearFilters(): void {
    this.data.query.title = '';
    this.filterByExtent = true;
    this.filterByOnlyMine = false;
    this.data.sortBy = SORTBYVALUES[0].name;
    this.data.type = TYPES[0].name;
    this.data.theme = INSPIRETHEMES[0].name;
    this.data.keywords.forEach((kw) => (kw.selected = false));
    this.loadCompositions();
  }
}
