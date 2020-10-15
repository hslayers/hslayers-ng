import {Component} from '@angular/core';
import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCompositionsMapService} from './compositions-map.service';
import {HsCompositionsMickaService} from './endpoints/compositions-micka.service';
import {HsCompositionsParserService} from './compositions-parser.service';
import {HsCompositionsService} from './compositions.service';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsMapService} from '../map/map.service';
import {HsSaveMapManagerService} from '../save-map/save-map-manager.service';
import {HsUtilsService} from '../utils/utils.service';
@Component({
  selector: 'hs.print',
  template: require('./partials/compositions.html'),
})
export class HsCompositionsComponent {
  /**
   * @ngdoc property
   * @name hs.compositions.controller#keywords
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
   * @ngdoc property
   * @name hs.compositions.controller#sortBy
   * @public
   * @type {string} bbox
   * @description Store current rule for sorting compositions in composition list (supported values: bbox, title, date)
   */
  sortBy = 'title';
  /**
   * @ngdoc property
   * @name hs.compositions.controller#filterByExtent
   * @public
   * @type {boolean} true
   * @description Store whether filter compositions by current window extent during composition search
   */
  filterByExtent = true;
  /**
   * @ngdoc method
   * @name hs.compositions.controller#getPreviousCompositions
   * @public
   * @description Load previous list of compositions to display on pager (number per page set by {@link hs.compositions.controller#page_size hs.compositions.controller#page_size})
   * @param ds
   */

  constructor(
    private HsMapService: HsMapService,
    private HsCompositionsService: HsCompositionsService,
    private HsCompositionsParserService: HsCompositionsParserService,
    private HsConfig: HsConfig,
    private HsCompositionsMickaService: HsCompositionsMickaService,
    private HsLayoutService: HsLayoutService,
    private HsCommonEndpointsService: HsCommonEndpointsService,
    private HsUtilsService: HsUtilsService,
    private HsCompositionsMapService: HsCompositionsMapService,
    private forCompositionsFilter: forCompositionsFilter,
    private HsEventBusService: HsEventBusService,
    private HsSaveMapManagerService: HsSaveMapManagerService
  ) {
    this.HsCommonEndpointsService.endpoints.forEach(
      (ep) => (ep.next = ep.limit)
    );
    HsEventBusService.mainPanelChanges.subscribe(() => {
      if (
        this.HsLayoutService.mainpanel === 'composition_browser' ||
        this.HsLayoutService.mainpanel === 'composition'
      ) {
        this.loadCompositionsForAllEndpoints();
      }
    });

    this.getPageSize();
    this.$window.addEventListener('resize', () => {
      this.getPageSize();
    });
    this.$on('HsCore_sizeChanged', () => {
      this.getPageSize();
    });

    let el = document.getElementsByClassName('mid-pane');
    if (el.length > 0) {
      el[0].style.marginTop = '0px';
    }
    el = document.getElementsByClassName('keywords-panel');
    if (el.length > 0) {
      el[0].style.display = 'none';
    }

    const extendChangeDebouncer = {};
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
        extendChangeDebouncer
      )
    );

    this.HsEventBusService.compositionDeletes.subscribe((composition) => {
      const deleteDialog = this.HsLayoutService.contentWrapper.querySelector(
        '.hs-composition-delete-dialog'
      );
      if (deleteDialog) {
        deleteDialog.parentNode.remove(deleteDialog);
      }
      this.loadCompositions(composition.endpoint);
    });

    this.$on('loadComposition.notSaved', (event, url, title) => {
      this.HsCompositionsService.compositionToLoad = {url, title};
      this.loadUnsavedDialogBootstrap(url, title);
    });

    this.$emit('scope_loaded', 'Compositions');
  }

  changeUrlButtonVisible() {
    this.addCompositionUrlVisible = !this.addCompositionUrlVisible;
  }

  getPreviousCompositions(ds) {
    if (ds.start - ds.limit < 0) {
      ds.start = 0;
      ds.next = ds.limit;
    } else {
      ds.start -= ds.limit;
      ds.next = ds.start + ds.limit;
    }
    this.loadCompositions(ds);
  }

  /**
   * @ngdoc method
   * @name hs.compositions.controller#getNextCompositions
   * @public
   * @description Load next list of compositions to display on pager (number per page set by {@link hs.compositions.controller#page_size hs.compositions.controller#page_size})
   * @param ds
   */
  getNextCompositions(ds) {
    if (ds.next != 0) {
      ds.start = Math.floor(ds.next / ds.limit) * ds.limit;

      if (ds.next + ds.limit > ds.compositionsCount) {
        ds.next = ds.compositionsCount;
      } else {
        ds.next += ds.limit;
      }
      this.loadCompositions(ds);
    }
  }

  /**
   * @ngdoc method
   * @name hs.compositions.controller#loadCompositions
   * @public
   * @description Load list of compositions according to current filter values and pager position (filter, keywords, current extent, start composition, compositions number per page). Display compositions extent in map
   * @param ds
   */
  loadCompositions(ds) {
    return new Promise((resolve, reject) => {
      this.HsMapService.loaded()
        .then((map) => {
          this.HsCompositionsService.loadCompositions(ds, {
            query: this.query,
            sortBy: this.sortBy,
            filterExtent: this.filterByExtent,
            keywords: this.keywords,
            start: ds.start,
            limit: ds.limit,
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
   *
   * @module hs.compositions.controller
   * @function miniFilterChanged
   * DEPRECATED?
   */
  mineFilterChanged() {
    if (this.query.editable !== undefined && this.query.editable == false) {
      delete this.query.editable;
    }
  }

  getPageSize() {
    let listHeight = screen.height;
    try {
      const $mdMedia = $injector.get('$mdMedia');
      if ($mdMedia('gt-sm')) {
        const panel = document.getElementById('sidenav-right');
        if (panel) {
          listHeight = panel.clientHeight;
        }
      }
    } catch (ex) {}
    this.HsCommonEndpointsService.endpoints.forEach((ds) => {
      ds.limit = Math.round((listHeight - 180) / 60);
    });
  }

  /**
   * @ngdoc method
   * @name hs.compositions.controller#filterChanged
   * @public
   * @description Reloads compositions from start, used as callback when filters are changed in view
   */
  filterChanged() {
    this.HsCompositionsService.resetCompositionCounter();
    this.forCompositionsFilter(this.HsCommonEndpointsService.endpoints).forEach(
      (ds) => {
        ds.start = 0;
        ds.next = ds.limit;
        this.loadCompositions(ds);
      }
    );
  }

  /**
   * @ngdoc method
   * @name hs.compositions.controller#confirmDelete
   * @public
   * @param {object} composition Composition selected for deletion
   * @description Display delete dialog of composition
   */
  confirmDelete(composition) {
    this.compositionToDelete = composition;
    this.deleteDialogBootstrap();
  }

  /**
   * @param ev
   */
  deleteDialogBootstrap() {
    const previousDialog = this.HsLayoutService.contentWrapper.querySelector(
      '.hs-composition-delete-dialog'
    );
    if (previousDialog) {
      previousDialog.parentNode.removeChild(previousDialog);
    }
    const el = angular.element(
      '<div hs.compositions.delete_dialog_directive></div>'
    );
    this.HsLayoutService.contentWrapper
      .querySelector('.hs-dialog-area')
      .appendChild(el[0]);
    $compile(el)($scope);
  }

  /**
   * @ngdoc method
   * @name hs.compositions.controller#delete
   * @public
   * @param {object} composition Composition selected for deletion
   * @description Delete selected composition from project (including deletion from composition server, useful for user created compositions)
   */
  delete(composition) {
    this.HsCompositionsService.deleteComposition(composition);
  }

  /**
   * Load selected composition for editing
   *
   * @module hs.compositions.controller
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
   * @ngdoc method
   * @name hs.compositions.controller#highlightComposition
   * @public
   * @param {object} composition Composition to highlight
   * @param {boolean} state Target state of composition ( True - highlighted, False - normal)
   * @description Highlight (or dim) composition, toogle visual state of composition extent on map
   */
  highlightComposition(composition, state) {
    this.HsCompositionsMapService.highlightComposition(composition, state);
  }

  loadCompositionsForAllEndpoints() {
    this.forCompositionsFilter(this.HsCommonEndpointsService.endpoints).forEach(
      (ds) => {
        this.loadCompositions(ds);
      }
    );
  }

  /**
   * @ngdoc method
   * @name hs.compositions.controller#shareComposition
   * @public
   * @param {object} record Composition to share
   * @param $event
   * @description Prepare share object on server and display share dialog to share composition
   */
  shareComposition(record, $event) {
    this.HsCompositionsService.shareComposition(record);
    this.shareDialogBootstrap();
  }

  /**
   * @param $event
   */
  shareDialogBootstrap() {
    const previousDialog = this.HsLayoutService.contentWrapper.querySelector(
      '.composition-share-dialog'
    );
    if (previousDialog) {
      previousDialog.parentNode.removeChild(previousDialog);
    }
    const el = angular.element(
      '<div hs.compositions.share_dialog_directive></div>'
    );
    $compile(el)($scope);
    this.HsLayoutService.contentWrapper
      .querySelector('.hs-dialog-area')
      .appendChild(el[0]);
  }

  /**
   * @ngdoc method
   * @name hs.compositions.controller#detailComposition
   * @public
   * @param {object} record Composition to show details
   * @param $event
   * @description Load info about composition through service and display composition info dialog
   */
  detailComposition(record, $event) {
    this.HsCompositionsService.getCompositionInfo(record, (info) => {
      this.info = info;
      this.infoDialogBootstrap();
    });
  }

  /**
   *
   */
  infoDialogBootstrap() {
    const previousDialog = this.HsLayoutService.contentWrapper.querySelector(
      '.hs-composition-info-dialog'
    );
    if (previousDialog) {
      previousDialog.parentNode.removeChild(previousDialog);
    }
    const el = angular.element(
      '<div hs.compositions.info_dialog_directive></div>'
    );
    this.HsLayoutService.contentWrapper
      .querySelector('.hs-dialog-area')
      .appendChild(el[0]);
    $compile(el)($scope);
  }

  /**
   * @ngdoc method
   * @name hs.compositions.controller#loadComposition
   * @public
   * @param {object} record Composition to be loaded
   * @description Load selected composition in map, if current composition was edited display Ovewrite dialog
   */
  startLoadComposition(record) {
    this.HsCompositionsService.loadCompositionParser(record)
  }

  /**
   * @ngdoc method
   * @name hs.compositions.controller#overwrite
   * @public
   * @description Load new composition without saving old composition
   */
  overwrite() {
    this.HsCompositionsService.loadComposition(
      this.HsCompositionsService.compositionToLoad.url,
      true
    );
    this.overwriteModalVisible = false;
  }

  /**
   * @ngdoc method
   * @name hs.compositions.controller#add
   * @public
   * @description Load new composition (with service_parser Load function) and merge it with old composition
   */
  add() {
    this.HsCompositionsService.loadComposition(
      this.HsCompositionsService.compositionToLoad.url,
      false
    );
    this.overwriteModalVisible = false;
  }

  addCompositionUrl(url) {
    if (this.HsCompositionsParserService.composition_edited == true) {
      $rootScope.$broadcast('loadComposition.notSaved', url);
    } else {
      this.HsCompositionsService.loadComposition(url, true).then((_) => {
        this.addCompositionUrlVisible = false;
      });
    }
  }

  /**
   * @ngdoc method
   * @name hs.compositions.controller#setSortAttribute
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
        const json = JSON.parse(reader.result);
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
    const dialog_id = 'hs-composition-overwrite-dialog';
    this.composition_name_to_be_loaded = title;
    if (
      this.HsLayoutService.contentWrapper.querySelector('.' + dialog_id) === null
    ) {
      const el = angular.element(
        '<div hs.compositions.overwrite_dialog_directive></span>'
      );
      this.HsLayoutService.contentWrapper
        .querySelector('.hs-dialog-area')
        .appendChild(el[0]);
      $compile(el)($scope);
    } else {
      this.overwriteModalVisible = true;
    }
  }

  commonId(composition) {
    return composition.uuid || composition.id;
  }

  compositionClicked(composition) {
    this.selectedCompId = this.commonId(composition);
    this.startLoadComposition(composition);
  }
}
