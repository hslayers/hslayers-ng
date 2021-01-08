import {Component} from '@angular/core';
import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCompositionsDeleteDialogComponent} from './dialogs/delete-dialog.component';
import {HsCompositionsInfoDialogComponent} from './dialogs/info-dialog.component';
import {HsCompositionsMapService} from './compositions-map.service';
import {HsCompositionsMickaService} from './endpoints/compositions-micka.service';
import {HsCompositionsOverwriteDialogComponent} from './dialogs/overwrite-dialog.component';
import {HsCompositionsParserService} from './compositions-parser.service';
import {HsCompositionsService} from './compositions.service';
import {HsCompositionsShareDialogComponent} from './dialogs/share-dialog.component';
import {HsConfig} from '../../config.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsEndpoint} from '../../common/endpoints/endpoint.interface';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsSaveMapManagerService} from '../save-map/save-map-manager.service';
import {HsUtilsService} from '../utils/utils.service';
import {HsLaymanService} from './../save-map/layman.service';
import {
  INSPIRETHEMES,
  KEYWORDS,
  SORTBYVALUES,
  TYPES,
} from './compositions-option-values';

type pagination = {
  start?: number;
  limit?: number;
  loaded?: boolean;
  matched?;
  next?;
};

@Component({
  selector: 'hs-compositions',
  templateUrl: './compositions.html',
  styles: [
    `
      .activeComposition {
        background-color: rgba(0, 0, 0, 0.2);
      }
    `,
  ],
})
export class HsCompositionsComponent {
  compositions: any[] = [];
  keywordsVisible = false;
  /**
   * @public
   * @type {object}
   * @description List of keywords (currently hard-coded selection), with their selection status (Boolean value) which sets if keyword will be applied in compositions lookup
   */
  keywords = KEYWORDS;
  urlToAdd = '';
  addCompositionUrlVisible = false;
  /**
   * @public
   * @description Store current rule for sorting compositions in composition list (supported values: bbox, title, date)
   */
  sortByValues = SORTBYVALUES;
  sortBy = SORTBYVALUES[0].name;
  types = TYPES;
  type = TYPES[0].name;
  inspireThemes = INSPIRETHEMES;
  theme = INSPIRETHEMES[0].name;
  /**
   * @public
   * @type {boolean} true
   * @description Store whether filter compositions by current window extent during composition search
   */
  paging: pagination = {
    start: 0,
    limit: 0,
    loaded: false,
    matched: 0,
    next: 0, 
  };
  itemsPerPage = 18;
  listStart = 0;
  listNext = this.itemsPerPage;
  filterByExtent = true;
  filterByOnlyMine = false;
  optionsButtonLabel = 'more';
  optionsMenuOpen = false;
  selectedCompId: any;
  query: {editable: boolean; title: string} = {editable: false, title: ''};
  activeTab = 0;
  constructor(
    public HsMapService: HsMapService,
    public HsCompositionsService: HsCompositionsService,
    public HsCompositionsParserService: HsCompositionsParserService,
    public HsConfig: HsConfig,
    public HsCompositionsMickaService: HsCompositionsMickaService,
    public HsLayoutService: HsLayoutService,
    public HsCommonEndpointsService: HsCommonEndpointsService,
    public HsUtilsService: HsUtilsService,
    public HsCompositionsMapService: HsCompositionsMapService,
    public HsEventBusService: HsEventBusService,
    public HsSaveMapManagerService: HsSaveMapManagerService,
    public HsDialogContainerService: HsDialogContainerService,
    public HsLogService: HsLogService,
    public HsLanguageService: HsLanguageService,
    public HsLaymanService: HsLaymanService
  ) {
      if (this.paging.limit === undefined || this.paging.limit == 0) {
        this.paging.limit = this.itemsPerPage / this.filteredEndpointsForCompositions().length
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

    this.HsCompositionsService.notSavedCompositionLoading.subscribe((url) => {
      this.HsCompositionsService.compositionToLoad = {url, title: ''};
      this.loadUnsavedDialogBootstrap(url, '');
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
   * @description Load previous list of compositions to display on pager
   */
  getPreviousCompositions(): void {
    if (this.listStart - this.itemsPerPage < 0) {
      this.listStart = 0;
      this.listNext = this.itemsPerPage;
    } else {
      this.listStart -= this.itemsPerPage;
      this.listNext = this.listStart + this.itemsPerPage;
    }
  }

  /**
   * @public
   * @description Load next list of compositions to display on pager
   */
  getNextCompositions(): void {
    this.listStart += this.itemsPerPage;
    this.listNext += this.itemsPerPage;
    if (
      this.listNext > this.compositions.length &&
      this.compositions.length < this.paging.matched
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
   * @description Load list of compositions according to current filter values and pager position (filter, keywords, current extent, start composition, compositions number per page). Display compositions extent in map
   * @param keepCompositions
   */
  loadCompositions(keepCompositions?: boolean): void {
    this.HsMapService.loaded().then(() => {
    if (keepCompositions === undefined || !keepCompositions) {
      // this.clearData();
    } 
    if (this.filterByOnlyMine) {
      this.loadCompositionFromEndpoint(this.HsLaymanService.getLaymanEndpoint());
    } else {
      for (const endpoint of this.filteredEndpointsForCompositions()) {
        this.loadCompositionFromEndpoint(endpoint);
      }
    }
    });
  }
  // clearData(): void {
  //   this.listStart = 0;
  //   this.listNext = this.itemsPerPage;
  //   this.compositions = [];
  //   this.paging.start = 0;
  //   this.filteredEndpointsForCompositions().forEach((ep: HsEndpoint) => (ep.compositions = [], ep.compositionsPaging.matched = 0, ep.compositionsPaging.next = ep.compositionsPaging.limit));
  // }
  loadCompositionFromEndpoint(ep: HsEndpoint): void {
      const promises = [];
      const promise = this.HsCompositionsService.loadCompositions(ep, {
        query: this.query,
        sortBy: this.sortBy,
        filterExtent: this.filterByExtent,
        keywords: this.keywords,
        theme: this.theme,
        type: this.type,
        start: this.paging.start,
        limit: this.paging.limit,
      });
      promises.push(promise);
      Promise.all(promises).then(() => {
        this.createCompositionList();
      });
  }
  createCompositionList(): void {
   // this.paging.matched = 0;
    for (const endpoint of this.filteredEndpointsForCompositions()) {
      if (endpoint.compositionsPaging.matched) {
        this.paging.matched += endpoint.compositionsPaging.matched;
      }
      if (endpoint.compositions && endpoint.compositions.length > 0) {
       // endpoint.compositions = endpoint.compositions.filter((newComp) => this.compositions.filter((comp) => comp.id || comp.uuid == newComp.id || newComp.uuid).length == 0)
        endpoint.compositions.forEach((composition) => {
            this.compositions.push(composition);
        });
      }
    }
   this.checkIfPageIsFull();
  }

  checkIfPageIsFull(): void {
    let boundByLimit: boolean;
    if (this.compositions.length < this.paging.matched && this.compositions.length < this.itemsPerPage) {
      boundByLimit = true;
    }
    if (this.compositions.length < this.listNext && boundByLimit) {
      this.paging.start += this.paging.limit;
      this.loadCompositions(true);
    }
  }

  keywordChecked(keyword): void {
    this.keywords.find((kw) => kw == keyword).selected = !keyword.selected;
    this.loadCompositions();
  }
  resultsVisible(): boolean {
    if (this.listNext && this.paging.matched) {
      return true;
    } else {
      return false;
    }
  }
  nextPageAvailable(): boolean {
    if (this.listNext == this.paging.matched || this.paging.matched == 0) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * @public
   * @description Reloads compositions from start, used as callback when filters are changed in view
   */
  filterChanged(): void {
    // this.HsCompositionsService.resetCompositionCounter();
     this.listStart = 0;
    this.listNext = this.itemsPerPage;
    this.loadCompositions();
  }

  filteredEndpointsForCompositions(): Array<HsEndpoint> {
    return this.HsCommonEndpointsService.endpoints.filter(
      (ep) => ep.type != 'statusmanager'
    );
  }

  /**
   * @public
   * @param {object} composition Composition selected for deletion
   * @description Display delete dialog of composition
   */
  confirmDelete(composition): void {
    this.deleteDialogBootstrap(composition);
  }

  /**
   * @param composition
   */
  deleteDialogBootstrap(composition): void {
    this.HsDialogContainerService.create(HsCompositionsDeleteDialogComponent, {
      compositionToDelete: composition,
    });
  }

  /**
   * @function openComposition
   * @description Load selected composition
   * @param {object} composition Selected composition
   */
  openComposition(composition): void {
    this.HsCompositionsService.loadCompositionParser(composition)
      .then(() => {
        // this.HsSaveMapManagerService.openPanel(composition);
        this.HsLayoutService.setMainPanel('layermanager');
      })
      .catch(() => {
        //Do nothing
      });
  }

  /**
   * @public
   * @param {object} composition Composition to highlight
   * @param {boolean} state Target state of composition ( True - highlighted, False - normal)
   * @description Highlight (or dim) composition, toogle visual state of composition extent on map
   */
  highlightComposition(composition, state: boolean): void {
    composition.highlighted = state;
    this.HsCompositionsMapService.highlightComposition(composition, state);
  }
  /**
   * @public
   * @param {object} record Composition to share
   * @description Prepare share object on server and display share dialog to share composition
   */
  async shareComposition(record): Promise<void> {
    try {
      const url = await this.HsCompositionsService.shareComposition(record);
      this.shareDialogBootstrap(record, url);
    } catch (ex) {
      this.HsLogService.error(ex);
    }
  }

  /**
   * @param record
   * @param url
   */
  shareDialogBootstrap(record, url): void {
    this.HsDialogContainerService.create(HsCompositionsShareDialogComponent, {
      url,
      title:
        this.HsConfig.social_hashtag &&
        !record.title.includes(this.HsConfig.social_hashtag)
          ? record.title + ' ' + this.HsConfig.social_hashtag
          : record.title,
      abstract: record.abstract,
    });
  }

  /**
   * @public
   * @param {object} record Composition to show details
   * @description Load info about composition through service and display composition info dialog
   */
  detailComposition(record): void {
    this.HsCompositionsService.getCompositionInfo(record, (info) => {
      this.infoDialogBootstrap(info);
    });
  }

  infoDialogBootstrap(info): void {
    this.HsDialogContainerService.create(HsCompositionsInfoDialogComponent, {
      info,
    });
  }

  /**
   * @public
   * @param url
   * @param {object} record Composition to be loaded
   * @description Load selected composition in map, if current composition was edited display Ovewrite dialog
   */

  addCompositionUrl(url): void {
    if (this.HsCompositionsParserService.composition_edited == true) {
      this.HsCompositionsService.notSavedCompositionLoading.next(url);
    } else {
      this.HsCompositionsService.loadComposition(url, true).then((_) => {
        this.addCompositionUrlVisible = false;
      });
    }
  }
  handleFileSelect(evt): void {
    const files = evt.target.files; // FileList object
    for (const f of files) {
      if (!f.type.match('application/json')) {
        continue;
      }
      const reader = new FileReader();
      reader.onload = (theFile) => {
        const json = JSON.parse(<string>reader.result);
        this.HsCompositionsParserService.loadCompositionObject(json, true);
      };
      reader.readAsText(f);
    }
  }

  /**
   * @param url
   * @param title
   */
  loadUnsavedDialogBootstrap(url, title): void {
    this.HsDialogContainerService.create(
      HsCompositionsOverwriteDialogComponent,
      {
        composition_name_to_be_loaded: title,
      }
    );
  }

  commonId(composition) {
    return composition.uuid || composition.id;
  }

  compositionClicked(composition): void {
    if (this.selectedCompId != this.commonId(composition)) {
      this.selectedCompId = this.commonId(composition);
    } else {
      this.selectedCompId = '';
    }
  }

  translateString(module: string, text: string): string {
    return this.HsLanguageService.getTranslationIgnoreNonExisting(module, text);
  }

  openOptionsMenu(): void {
    this.optionsMenuOpen = !this.optionsMenuOpen;
    if (this.optionsMenuOpen) {
      this.optionsButtonLabel = 'less';
    } else {
      this.optionsButtonLabel = 'more';
    }
  }
  clearFilters(): void {
    this.query.title = '';
    this.filterByExtent = true;
    this.filterByOnlyMine = false;
    this.sortBy = SORTBYVALUES[0].name;
    this.type = TYPES[0].name;
    this.theme = INSPIRETHEMES[0].name;
    this.keywords.forEach((kw) => (kw.selected = false));
    this.optionsMenuOpen = false;
    this.loadCompositions();
  }
  changeUrlButtonVisible(): void {
    this.addCompositionUrlVisible = !this.addCompositionUrlVisible;
  }
  openSaveMapPanel(): void {
    this.HsLayoutService.setMainPanel('saveMap');
  }
}
