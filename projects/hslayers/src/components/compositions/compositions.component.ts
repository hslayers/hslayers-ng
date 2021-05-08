import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsCompositionsCatalogueService} from './compositions-catalogue.service';
import {HsCompositionsMapService} from './compositions-map.service';
import {HsCompositionsOverwriteDialogComponent} from './dialogs/overwrite-dialog.component';
import {HsCompositionsParserService} from './compositions-parser.service';
import {HsCompositionsService} from './compositions.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsLaymanService} from './../save-map/layman.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsSaveMapManagerService} from '../save-map/save-map-manager.service';
import {HsUtilsService} from '../utils/utils.service';
@Component({
  selector: 'hs-compositions',
  templateUrl: './compositions.html',
})
export class HsCompositionsComponent implements OnDestroy {
  keywordsVisible = false;
  themesVisible = false;
  urlToAdd = '';
  addCompositionUrlVisible = false;
  optionsButtonLabel = 'more';
  optionsMenuOpen = false;
  selectedCompId: any;
  loadFilteredCompositions: any;
  notSavedCompositionLoadingSubscription: Subscription;
  constructor(
    public hsCompositionsService: HsCompositionsService,
    public hsCompositionsParserService: HsCompositionsParserService,
    public hsLayoutService: HsLayoutService,
    public hsUtilsService: HsUtilsService,
    public hsCompositionsMapService: HsCompositionsMapService,
    public hsSaveMapManagerService: HsSaveMapManagerService,
    public hsDialogContainerService: HsDialogContainerService,
    public hsCompositionsCatalogueService: HsCompositionsCatalogueService,
    public hsLaymanService: HsLaymanService
  ) {
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
  resultsVisible(): boolean {
    if (
      this.hsCompositionsCatalogueService.listNext &&
      this.hsCompositionsCatalogueService.matchedCompositions
    ) {
      return true;
    } else {
      return false;
    }
  }
  nextPageAvailable(): boolean {
    return this.hsCompositionsCatalogueService.nextPageAvailable();
  }
  /**
   * Load previous list of compositions to display on pager
   */
  getPreviousCompositions(): void {
    this.hsCompositionsCatalogueService.getPreviousCompositions();
  }

  /**
   * Load next list of compositions to display on pager
   */
  getNextCompositions(): void {
    this.hsCompositionsCatalogueService.getNextCompositions();
  }

  /**
   * @param composition Composition to highlight
   * @param state Target state of composition ( True - highlighted, False - normal)
   * Highlight (or dim) composition, toogle visual state of composition extent on map
   */
  highlightComposition(composition, state: boolean): void {
    composition.highlighted = state;
    this.hsCompositionsMapService.highlightComposition(composition, state);
  }

  /**
   * @param url
   * @param record Composition to be loaded
   * Load selected composition in map, if current composition was edited display Ovewrite dialog
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
      reader.onload = (theFile) => {
        const json = JSON.parse(<string>reader.result);
        this.hsCompositionsParserService.loadCompositionObject(json, true);
      };
      reader.readAsText(f);
    }
  }
  /**
   * @param url
   * @param title
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
