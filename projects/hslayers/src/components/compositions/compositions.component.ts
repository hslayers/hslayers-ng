import {Component, OnInit} from '@angular/core';
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
import {
  INSPIRETHEMES,
  KEYWORDS,
  SORTBYVALUES,
  TYPES,
} from './compositions-option-values';
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
export class HsCompositionsComponent implements OnInit {
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
  filterByExtent = true;
  filterByOnlyMine = false;
  optionsButtonLabel = 'more';
  optionsMenuOpen = false;
  selectedCompId: any;
  query: {editable: boolean; title: string} = {editable: false, title: ''};
  activeTab = 0;
  laymanEndpoint: HsEndpoint;
  compositions: any[] = [];
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
    public HsLanguageService: HsLanguageService
  ) {
    this.filteredEndpointsForCompositions().forEach(
      (ep: HsEndpoint) =>
        (ep.compositionsPaging.next = ep.compositionsPaging.limit)
    );
    this.filteredEndpointsForCompositions().find((ep: HsEndpoint) =>
      ep.type == 'layman'
        ? (this.laymanEndpoint = ep)
        : (this.laymanEndpoint = undefined)
    );
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
        (data) => {
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

  ngOnInit(): void {
    this.getPageSize();
    this.HsEventBusService.layoutResizes.subscribe(() => {
      this.getPageSize();
    });
  }

  changeUrlButtonVisible(): void {
    this.addCompositionUrlVisible = !this.addCompositionUrlVisible;
  }
  openSaveMapPanel(): void {
    this.HsLayoutService.setMainPanel('saveMap');
  }
  /**
   * @public
   * @description Load previous list of compositions to display on pager (number per page set by {@link hs.compositions.controller#page_size hs.compositions.controller#page_size})
   * @param ds
   */
  // getPreviousCompositions(ds: HsEndpoint): void {
  //   const paging = ds.compositionsPaging;
  //   if (paging.start - paging.limit < 0) {
  //     paging.start = 0;
  //     paging.next = paging.limit;
  //   } else {
  //     paging.start -= paging.limit;
  //     paging.next = paging.start + paging.limit;
  //   }
  //   this.loadCompositions(ds);
  // }

  /**
   * @public
   * @description Load next list of compositions to display on pager (number per page set by {@link hs.compositions.controller#page_size hs.compositions.controller#page_size})
   * @param ds
   */
  // getNextCompositions(ds: HsEndpoint): void {
  //   const paging = ds.compositionsPaging;
  //   if (paging.next != 0) {
  //     paging.start = Math.floor(paging.next / paging.limit) * paging.limit;

  //     if (paging.next + paging.limit > paging.matched) {
  //       paging.next = paging.matched;
  //     } else {
  //       paging.next += paging.limit;
  //     }
  //     this.loadCompositions(ds);
  //   }
  // }

  /**
   * @public
   * @description Load list of compositions according to current filter values and pager position (filter, keywords, current extent, start composition, compositions number per page). Display compositions extent in map
   * @param ds
   * @returns {Promise}
   */
  loadCompositions(clearCompositions?: boolean): void {
    if (clearCompositions) {
      this.compositions = [];
    }
    for (const endpoint of this.filteredEndpointsForCompositions()) {
      this.HsMapService.loaded().then(() => {
        const promises = [];
        const promise = this.HsCompositionsService.loadCompositions(endpoint, {
          query: this.query,
          sortBy: this.sortBy,
          filterExtent: this.filterByExtent,
          onlyMine: this.filterByOnlyMine, //is not active
          keywords: this.keywords,
          theme: this.theme,
          type: this.type,
          start: endpoint.compositionsPaging.start,
          limit: endpoint.compositionsPaging.limit,
        });
        promises.push(promise);
        Promise.all(promises).then(() => {
          this.createCompositionList();
        });
      });
    }
  }
  createCompositionList(): void {
    for (const endpoint of this.filteredEndpointsForCompositions()) {
      console.log(endpoint.compositions);
      if (endpoint.compositions && endpoint.compositions.length > 0) {
        endpoint.compositions.forEach((composition) => {
          if (
            this.compositions.filter((comp) => comp.id == composition.id)
              .length == 0
          ) {
            this.compositions.push(composition);
          }
        });
      }
    }
  }
  keywordChecked(keyword) {
    this.keywords.find((kw) => kw == keyword).selected = !keyword.selected;
    this.loadCompositions(true);
  }

  getPageSize(): void {
    const compList = this.HsLayoutService.contentWrapper.querySelector(
      '.hs-comp-list'
    );
    if (compList) {
      // const listHeight = compList.innerHeight;
      for (const ds of this.filteredEndpointsForCompositions()) {
        ds.compositionsPaging.limit = 20;
        //Math.round((listHeight - 180) / 60);
      }
    }
  }

  /**
   * @public
   * @description Reloads compositions from start, used as callback when filters are changed in view
   */
  filterChanged(): void {
    this.HsCompositionsService.resetCompositionCounter();
    for (const ds of this.filteredEndpointsForCompositions()) {
      ds.compositionsPaging.start = 0;
      ds.compositionsPaging.next = ds.compositionsPaging.limit;
    }
    this.loadCompositions(true);
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

  // loadCompositionsForAllEndpoints(): void {
  //   this.filteredEndpointsForCompositions().forEach((ds) => {
  //     this.loadCompositions(ds);
  //   });
  // }

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
  // startLoadComposition(record): void {
  //   this.HsCompositionsService.loadCompositionParser(record).catch(() => {
  //     //Do nothing, probably now asking for overwrite of composition
  //   });
  // }

  addCompositionUrl(url): void {
    if (this.HsCompositionsParserService.composition_edited == true) {
      this.HsCompositionsService.notSavedCompositionLoading.next(url);
    } else {
      this.HsCompositionsService.loadComposition(url, true).then((_) => {
        this.addCompositionUrlVisible = false;
      });
    }
  }

  /**
   * @public
   * @description Sort compositions list and reload compositions
   */
  sortCompositions(): void {
    this.loadCompositions(true);
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
}
