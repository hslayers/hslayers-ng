import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {
  HsCompositionsCatalogueParams,
  HsCompositionsCatalogueService,
} from './compositions-catalogue.service';
import {HsCompositionsMapService} from './compositions-map.service';
import {HsCompositionsOverwriteDialogComponent} from './dialogs/overwrite-dialog.component';
import {HsCompositionsParserService} from './compositions-parser.service';
import {HsCompositionsService} from './compositions.service';
import {HsConfig, HsConfigObject} from '../../config.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsLanguageService} from '../language/language.service';
import {HsLaymanService} from './../save-map/layman.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapCompositionDescriptor} from './models/composition-descriptor.model';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsSidebarService} from '../sidebar/sidebar.service';

@Component({
  selector: 'hs-compositions',
  templateUrl: './compositions.component.html',
})
export class HsCompositionsComponent
  extends HsPanelBaseComponent
  implements OnDestroy, OnInit
{
  keywordsVisible = false;
  themesVisible = false;
  urlToAdd = '';
  addCompositionUrlVisible = false;
  optionsButtonLabel = 'more';
  optionsMenuOpen = false;
  selectedCompId: string;
  loadFilteredCompositions: any;
  notSavedCompositionLoadingSubscription: Subscription;
  name = 'composition_browser';
  catalogueRef: HsCompositionsCatalogueParams;
  configRef: HsConfigObject;
  constructor(
    private hsCompositionsService: HsCompositionsService,
    private hsCompositionsParserService: HsCompositionsParserService,
    public hsLayoutService: HsLayoutService,
    private hsConfig: HsConfig,
    private hsCompositionsMapService: HsCompositionsMapService,
    private hsDialogContainerService: HsDialogContainerService,
    public hsCompositionsCatalogueService: HsCompositionsCatalogueService,
    private hsLaymanService: HsLaymanService,
    private hsSidebarService: HsSidebarService,
    private hsLanguageService: HsLanguageService,
    public hsCommonLaymanService: HsCommonLaymanService
  ) {
    super(hsLayoutService);
  }
  ngOnInit(): void {
    this.hsSidebarService.addButton(
      {
        panel: 'composition_browser',
        module: 'hs.compositions',
        order: 3,
        fits: true,
        title: 'PANEL_HEADER.MAPCOMPOSITIONS',
        description: 'SIDEBAR.descriptions.MAPCOMPOSITIONS',
        icon: 'icon-map',
      },
      this.data.app
    );
    this.configRef = this.hsConfig.get(this.data.app);
    this.hsCompositionsCatalogueService.init(this.data.app);
    this.hsCompositionsService.init(this.data.app);
    this.hsCompositionsMapService.init(this.data.app);
    this.catalogueRef = this.hsCompositionsCatalogueService.get(this.data.app);
    this.loadFilteredCompositions = () =>
      this.hsCompositionsCatalogueService.loadFilteredCompositions(
        this.data.app
      );
    this.notSavedCompositionLoadingSubscription = this.hsCompositionsService
      .get(this.data.app)
      .notSavedCompositionLoading.subscribe((url) => {
        this.hsCompositionsService.get(this.data.app).compositionToLoad = {
          url,
          title: '',
        };
        this.loadUnsavedDialogBootstrap('');
      });
  }

  ngOnDestroy(): void {
    this.notSavedCompositionLoadingSubscription.unsubscribe();
  }

  /**
   * @param composition - Composition to highlight
   * @param state - Target state of composition ( True - highlighted, False - normal)
   * Highlight (or dim) composition, toggle visual state of composition extent on map
   */
  highlightComposition(
    composition: HsMapCompositionDescriptor,
    state: boolean
  ): void {
    composition.highlighted = state;
    this.hsCompositionsMapService.highlightComposition(
      composition,
      state,
      this.data.app
    );
  }

  /**
   * @param url -
   * Load selected composition in map, if current composition was edited display Overwrite dialog
   */

  addCompositionUrl(url: string): void {
    if (
      this.hsCompositionsParserService.get(this.data.app).composition_edited ==
      true
    ) {
      this.hsCompositionsService
        .get(this.data.app)
        .notSavedCompositionLoading.next(url);
    } else {
      this.hsCompositionsService
        .loadComposition(url, this.data.app, true)
        .then((_) => {
          this.addCompositionUrlVisible = false;
        });
    }
  }

  /**
   * @param evt - File upload event
   * @param app - App identifier
   * Handle composition upload from file list
   */
  handleFileSelect(evt, app: string): void {
    const files = evt.target.files; // FileList object
    for (const f of files) {
      if (!f.type.match('application/json')) {
        continue;
      }
      const reader = new FileReader();
      reader.onload = async (theFile) => {
        const json = JSON.parse(<string>reader.result);
        await this.hsCompositionsParserService.loadCompositionObject(
          json,
          true,
          app
        );
      };
      reader.readAsText(f);
    }
  }
  /**
   * Open overwrite dialog
   * @param title - Dialog title
   */
  loadUnsavedDialogBootstrap(title: string): void {
    this.hsDialogContainerService.create(
      HsCompositionsOverwriteDialogComponent,
      {
        composition_name_to_be_loaded: title,
        app: this.data.app,
      },
      this.data.app
    );
  }

  /**
   * Open options menu
   */
  openOptionsMenu(): void {
    this.optionsMenuOpen = !this.optionsMenuOpen;
    if (this.optionsMenuOpen) {
      this.optionsButtonLabel = 'less';
      this.keywordsVisible = false;
      this.themesVisible = false;
    } else {
      this.optionsButtonLabel = 'more';
    }
  }
  /**
   * Clear all options menu filters
   */
  clearFilters(): void {
    this.optionsMenuOpen = false;
    this.themesVisible = false;
    this.keywordsVisible = false;
    this.selectedCompId = '';
    this.hsCompositionsCatalogueService.clearFilters(this.data.app);
  }
  /**
   * Change add composition url button visibility
   */
  changeUrlButtonVisible(): void {
    this.addCompositionUrlVisible = !this.addCompositionUrlVisible;
  }
  /**
   * Open save map panel
   */
  openSaveMapPanel(): void {
    this.hsLayoutService.setMainPanel('saveMap', this.data.app);
  }
  /**
   * Act on composition clicked
   * @param composition - Composition list item selected
   */
  compositionClicked(composition: HsMapCompositionDescriptor): void {
    if (
      this.selectedCompId != this.hsCompositionsService.commonId(composition)
    ) {
      this.selectedCompId = this.hsCompositionsService.commonId(composition);
    } else {
      this.selectedCompId = '';
    }
  }
  /**
   * Reload compositions list
   */
  reload(): void {
    this.clearFilters();
    this.loadFilteredCompositions();
  }

  /**
   * Act on sort value changes for sorting compositions
   * @param sortBy - Sorting value
   */
  sortByValueChanged(sortBy: any): void {
    this.catalogueRef.data.sortBy = sortBy;
    this.loadFilteredCompositions();
  }

  /**
   * Translate string value to the selected UI language
   * @param module - Locales json key
   * @param text - Locales json key value
   * @returns Translated text
   */
  translateString(module: string, text: string): string {
    return this.hsLanguageService.getTranslationIgnoreNonExisting(
      module,
      text,
      undefined,
      this.data.app
    );
  }
  /**
   * Get save map panel status
   */
  saveMapAvailable(): boolean {
    return this.hsLayoutService.panelEnabled('saveMap', this.data.app);
  }
}
