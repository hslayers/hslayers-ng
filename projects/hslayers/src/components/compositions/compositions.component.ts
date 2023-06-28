import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subject, Subscription, takeUntil} from 'rxjs';

import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsCompositionsCatalogueService} from './compositions-catalogue.service';
import {HsCompositionsMapService} from './compositions-map.service';
import {HsCompositionsOverwriteDialogComponent} from './dialogs/overwrite-dialog.component';
import {HsCompositionsParserService} from './compositions-parser.service';
import {HsCompositionsService} from './compositions.service';
import {HsConfig} from '../../config.service';
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
  private end = new Subject<void>();

  keywordsVisible = false;
  themesVisible = false;
  urlToAdd = '';
  addCompositionUrlVisible = false;
  optionsButtonLabel = 'more';
  optionsMenuOpen = false;
  selectedCompId: string;
  loadFilteredCompositions: any;
  name = 'composition_browser';
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
    this.hsSidebarService.addButton({
      panel: 'composition_browser',
      module: 'hs.compositions',
      order: 3,
      fits: true,
      title: 'PANEL_HEADER.MAPCOMPOSITIONS',
      description: 'SIDEBAR.descriptions.MAPCOMPOSITIONS',
      icon: 'icon-map',
    });
    this.loadFilteredCompositions = () =>
      this.hsCompositionsCatalogueService.loadFilteredCompositions();
    this.hsCompositionsService.notSavedOrEditedCompositionLoading
      .pipe(takeUntil(this.end))
      .subscribe(({url, record}) => {
        this.hsCompositionsService.compositionToLoad = {
          url,
          title: record.title,
        };
        this.loadUnsavedDialogBootstrap(record);
      });
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
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
    this.hsCompositionsMapService.highlightComposition(composition, state);
  }

  /**
   * @param url -
   * Load selected composition in map, if current composition was edited display Overwrite dialog
   */
  addCompositionUrl(url: string): void {
    if (
      this.hsCompositionsParserService.composition_edited ||
      this.hsCompositionsParserService.composition_loaded
    ) {
      this.hsCompositionsService.notSavedOrEditedCompositionLoading.next({
        url,
        record: {title: 'Composition from URL'},
      });
    } else {
      this.hsCompositionsService.loadComposition(url, true).then((_) => {
        this.addCompositionUrlVisible = false;
      });
    }
  }

  /**
   * @param evt - File upload event
   
   * Handle composition upload from file list
   */
  handleFileSelect(evt): void {
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
          true
        );
      };
      reader.readAsText(f);
    }
  }
  /**
   * Open overwrite dialog
   * @param title - Dialog title
   */
  loadUnsavedDialogBootstrap(record: any): void {
    this.hsDialogContainerService.create(
      HsCompositionsOverwriteDialogComponent,
      record
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
    this.hsCompositionsCatalogueService.clearFilters();
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
    this.hsLayoutService.setMainPanel('saveMap');
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
    this.hsCompositionsCatalogueService.data.sortBy = sortBy;
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
      undefined
    );
  }
  /**
   * Get save map panel status
   */
  saveMapAvailable(): boolean {
    return this.hsLayoutService.panelEnabled('saveMap');
  }
}
