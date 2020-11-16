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
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsSaveMapManagerService} from '../save-map/save-map-manager.service';
import {HsUtilsService} from '../utils/utils.service';
@Component({
  selector: 'hs-compositions',
  templateUrl: './compositions.html',
})
export class HsCompositionsComponent implements OnInit {
  /**
   * @public
   * @type {object}
   * @description List of keywords (currently hard-coded selection), with their selection status (Boolean value) which sets if keyword will be applied in compositions lookup
   */
  keywords = {
    'Basemap': false,
    'Borders': false,
    'PhysicalGeography': false,
    'Demographics': false,
    'Economics': false,
    'SocioPoliticalConditions': false,
    'Culture': false,
    'Transport': false,
    'LandUse': false,
    'Environment': false,
    'Water': false,
    'Hazards': false,
    'Cadastre': false,
    'Infrastructure': false,
    'RealEstate': false,
    'Planning': false,
    'ComplexInformation': false,
  };
  addCompositionUrlVisible = false;
  /**
   * @public
   * @type {string} bbox
   * @description Store current rule for sorting compositions in composition list (supported values: bbox, title, date)
   */
  sortBy = 'title';
  /**
   * @public
   * @type {boolean} true
   * @description Store whether filter compositions by current window extent during composition search
   */
  filterByExtent = true;
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
    public $window: Window,
    public HsLogService: HsLogService
  ) {
    this.filteredEndpointsForCompositions().forEach(
      (ep: HsEndpoint) =>
        (ep.compositionsPaging.next = ep.compositionsPaging.limit)
    );
    HsEventBusService.mainPanelChanges.subscribe(() => {
      if (
        this.HsLayoutService.mainpanel === 'composition_browser' ||
        this.HsLayoutService.mainpanel === 'composition'
      ) {
        this.loadCompositionsForAllEndpoints();
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
            this.loadCompositionsForAllEndpoints();
          }
        },
        400,
        false,
        extentChangeDebouncer
      )
    );

    this.HsEventBusService.compositionDeletes.subscribe((composition) => {
      //TODO rewrite
      const deleteDialog = this.HsLayoutService.contentWrapper.querySelector(
        '.hs-composition-delete-dialog'
      );
      if (deleteDialog) {
        deleteDialog.parentNode.remove(deleteDialog);
      }
      this.loadCompositions(composition.endpoint);
    });

    this.HsCompositionsService.notSavedCompositionLoading.subscribe((url) => {
      this.HsCompositionsService.compositionToLoad = {url, title: ''};
      this.loadUnsavedDialogBootstrap(url, '');
    });
  }

  ngOnInit() {
    this.getPageSize();
    this.HsEventBusService.layoutResizes.subscribe(() => {
      this.getPageSize();
    });
  }

  changeUrlButtonVisible() {
    this.addCompositionUrlVisible = !this.addCompositionUrlVisible;
  }

  /**
   * @public
   * @description Load previous list of compositions to display on pager (number per page set by {@link hs.compositions.controller#page_size hs.compositions.controller#page_size})
   * @param ds
   */
  getPreviousCompositions(ds: HsEndpoint) {
    const paging = ds.compositionsPaging;
    if (paging.start - paging.limit < 0) {
      paging.start = 0;
      paging.next = paging.limit;
    } else {
      paging.start -= paging.limit;
      paging.next = paging.start + paging.limit;
    }
    this.loadCompositions(ds);
  }

  /**
   * @public
   * @description Load next list of compositions to display on pager (number per page set by {@link hs.compositions.controller#page_size hs.compositions.controller#page_size})
   * @param ds
   */
  getNextCompositions(ds: HsEndpoint) {
    const paging = ds.compositionsPaging;
    if (paging.next != 0) {
      paging.start = Math.floor(paging.next / paging.limit) * paging.limit;

      if (paging.next + paging.limit > paging.matched) {
        paging.next = paging.matched;
      } else {
        paging.next += paging.limit;
      }
      this.loadCompositions(ds);
    }
  }

  /**
   * @public
   * @description Load list of compositions according to current filter values and pager position (filter, keywords, current extent, start composition, compositions number per page). Display compositions extent in map
   * @param ds
   */
  loadCompositions(ds: HsEndpoint) {
    return new Promise((resolve, reject) => {
      this.HsMapService.loaded()
        .then((map) => {
          this.HsCompositionsService.loadCompositions(ds, {
            query: this.query,
            sortBy: this.sortBy,
            filterExtent: this.filterByExtent,
            keywords: this.keywords,
            start: ds.compositionsPaging.start,
            limit: ds.compositionsPaging.limit,
          }).then((_) => {
            resolve();
          });
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  /**
   * Handler of "Only mine" filter change, delete editable variable if needed
   */
  mineFilterChanged() {
    if (this.query.editable !== undefined && this.query.editable == false) {
      delete this.query.editable;
    }
  }

  getPageSize() {
    const compList = this.HsLayoutService.contentWrapper.querySelector(
      '.hs-comp-list'
    );
    if (compList) {
      const listHeight = compList.innerHeight;
      for (const ds of this.filteredEndpointsForCompositions()) {
        ds.compositionsPaging.limit = Math.round((listHeight - 180) / 60);
      }
    }
  }

  /**
   * @public
   * @description Reloads compositions from start, used as callback when filters are changed in view
   */
  filterChanged() {
    this.HsCompositionsService.resetCompositionCounter();
    for (const ds of this.filteredEndpointsForCompositions()) {
      ds.compositionsPaging.start = 0;
      ds.compositionsPaging.next = ds.compositionsPaging.limit;
      this.loadCompositions(ds);
    }
  }

  private filteredEndpointsForCompositions(): Array<HsEndpoint> {
    return this.HsCommonEndpointsService.endpoints.filter(
      (ep) => ep.type != 'statusmanager'
    );
  }

  /**
   * @public
   * @param {object} composition Composition selected for deletion
   * @description Display delete dialog of composition
   */
  confirmDelete(composition) {
    this.deleteDialogBootstrap(composition);
  }

  /**
   * @param ev
   * @param composition
   */
  deleteDialogBootstrap(composition) {
    this.HsDialogContainerService.create(HsCompositionsDeleteDialogComponent, {
      compositionToDelete: composition,
    });
  }

  /**
   * Load selected composition for editing
   *
   * @function edit
   * @param {object} composition Selected composition
   */
  edit(composition) {
    this.HsCompositionsService.loadCompositionParser(composition)
      .then(() => {
        this.HsSaveMapManagerService.openPanel(composition);
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
  highlightComposition(composition, state) {
    this.HsCompositionsMapService.highlightComposition(composition, state);
  }

  loadCompositionsForAllEndpoints() {
    this.filteredEndpointsForCompositions().forEach((ds) => {
      this.loadCompositions(ds);
    });
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
   * @param $event
   * @param record
   * @param url
   */
  shareDialogBootstrap(record, url) {
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
   * @param $event
   * @description Load info about composition through service and display composition info dialog
   */
  detailComposition(record, $event) {
    this.HsCompositionsService.getCompositionInfo(record, (info) => {
      this.infoDialogBootstrap(info);
    });
  }

  infoDialogBootstrap(info) {
    this.HsDialogContainerService.create(HsCompositionsInfoDialogComponent, {
      info,
    });
  }

  /**
   * @public
   * @param {object} record Composition to be loaded
   * @description Load selected composition in map, if current composition was edited display Ovewrite dialog
   */
  startLoadComposition(record) {
    this.HsCompositionsService.loadCompositionParser(record).catch(() => {
      //Do nothing, probably now asking for overwrite of composition
    });
  }

  addCompositionUrl(url) {
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
   * @param {string} attribute Attribute by which compositions should be sorted (expected values: bbox, title, date)
   * @description Set sort attribute for sorting composition list and reload compositions
   */
  setSortAttribute(attribute) {
    this.sortBy = attribute;
    this.loadCompositionsForAllEndpoints();
  }

  handleFileSelect(evt) {
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
  loadUnsavedDialogBootstrap(url, title) {
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

  compositionClicked(composition) {
    this.selectedCompId = this.commonId(composition);
    this.startLoadComposition(composition);
  }
}
