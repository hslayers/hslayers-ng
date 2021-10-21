import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsCompositionsCatalogueService} from './compositions-catalogue.service';
import {HsCompositionsMapService} from './compositions-map.service';
import {HsCompositionsOverwriteDialogComponent} from './dialogs/overwrite-dialog.component';
import {HsCompositionsParserService} from './compositions-parser.service';
import {HsCompositionsService} from './compositions.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsLanguageService} from '../language/language.service';
import {HsLaymanService} from './../save-map/layman.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsSaveMapManagerService} from '../save-map/save-map-manager.service';
import {HsSidebarService} from '../sidebar/sidebar.service';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs-compositions',
  templateUrl: './compositions.html',
})
export class HsCompositionsComponent
  extends HsPanelBaseComponent
  implements OnDestroy
{
  keywordsVisible = false;
  themesVisible = false;
  urlToAdd = '';
  addCompositionUrlVisible = false;
  optionsButtonLabel = 'more';
  optionsMenuOpen = false;
  selectedCompId: any;
  loadFilteredCompositions: any;
  notSavedCompositionLoadingSubscription: Subscription;
  name = 'composition_browser';

  constructor(
    public hsCompositionsService: HsCompositionsService,
    public hsCompositionsParserService: HsCompositionsParserService,
    public hsLayoutService: HsLayoutService,
    public hsUtilsService: HsUtilsService,
    public hsCompositionsMapService: HsCompositionsMapService,
    public hsSaveMapManagerService: HsSaveMapManagerService,
    public hsDialogContainerService: HsDialogContainerService,
    public hsCompositionsCatalogueService: HsCompositionsCatalogueService,
    public hsLaymanService: HsLaymanService,
    hsSidebarService: HsSidebarService,
    hsLanguageService: HsLanguageService
  ) {
    super(hsLayoutService);
    hsSidebarService.buttons.push({
      panel: 'composition_browser',
      module: 'hs.compositions',
      order: 3,
      fits: true,
      title: () =>
        hsLanguageService.getTranslation('PANEL_HEADER.MAPCOMPOSITIONS'),
      description: () =>
        hsLanguageService.getTranslation(
          'SIDEBAR.descriptions.MAPCOMPOSITIONS'
        ),
      icon: 'icon-map',
    });
    this.loadFilteredCompositions = () =>
      hsCompositionsCatalogueService.loadFilteredCompositions();
    this.notSavedCompositionLoadingSubscription =
      this.hsCompositionsService.notSavedCompositionLoading.subscribe((url) => {
        this.hsCompositionsService.compositionToLoad = {url, title: ''};
        this.loadUnsavedDialogBootstrap(url, '');
      });
  }
  ngOnDestroy(): void {
    this.notSavedCompositionLoadingSubscription.unsubscribe();
  }

  /**
   * @param composition Composition to highlight
   * @param state Target state of composition ( True - highlighted, False - normal)
   * Highlight (or dim) composition, toggle visual state of composition extent on map
   */
  highlightComposition(composition, state: boolean): void {
    composition.highlighted = state;
    this.hsCompositionsMapService.highlightComposition(composition, state);
  }

  /**
   * @param url -
   * Load selected composition in map, if current composition was edited display Overwrite dialog
   */

  addCompositionUrl(url): void {
    if (this.hsCompositionsParserService.composition_edited == true) {
      this.hsCompositionsService.notSavedCompositionLoading.next(url);
    } else {
      this.hsCompositionsService.loadComposition(url, true).then((_) => {
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
   * @param url -
   * @param title -
   */
  loadUnsavedDialogBootstrap(url, title): void {
    this.hsDialogContainerService.create(
      HsCompositionsOverwriteDialogComponent,
      {
        composition_name_to_be_loaded: title,
      }
    );
  }

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
  clearFilters(): void {
    this.optionsMenuOpen = false;
    this.themesVisible = false;
    this.keywordsVisible = false;
    this.selectedCompId = '';
    this.hsCompositionsCatalogueService.clearFilters();
  }
  changeUrlButtonVisible(): void {
    this.addCompositionUrlVisible = !this.addCompositionUrlVisible;
  }
  openSaveMapPanel(): void {
    this.hsLayoutService.setMainPanel('saveMap');
  }
  compositionClicked(composition): void {
    if (
      this.selectedCompId != this.hsCompositionsService.commonId(composition)
    ) {
      this.selectedCompId = this.hsCompositionsService.commonId(composition);
    } else {
      this.selectedCompId = '';
    }
  }
  reload(): void {
    this.clearFilters();
    this.loadFilteredCompositions();
  }

  sortByValueChanged(sortBy: any): void {
    this.hsCompositionsCatalogueService.data.sortBy = sortBy;
    this.loadFilteredCompositions();
  }
}
