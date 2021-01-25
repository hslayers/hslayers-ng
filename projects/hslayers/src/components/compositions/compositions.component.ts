import {Component} from '@angular/core';
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
  styles: [
    `
      .activeComposition {
        background-color: rgba(0, 0, 0, 0.2);
      }
    `,
  ],
})
export class HsCompositionsComponent {
  keywordsVisible = false;
  themesVisible = false;
  urlToAdd = '';
  addCompositionUrlVisible = false;
  optionsButtonLabel = 'more';
  optionsMenuOpen = false;
  selectedCompId: any;
  loaderImage: string;
  loadFilteredCompositions: any;
  constructor(
    public HsCompositionsService: HsCompositionsService,
    public HsCompositionsParserService: HsCompositionsParserService,
    public HsLayoutService: HsLayoutService,
    public HsUtilsService: HsUtilsService,
    public HsCompositionsMapService: HsCompositionsMapService,
    public HsSaveMapManagerService: HsSaveMapManagerService,
    public HsDialogContainerService: HsDialogContainerService,
    public HsCompositionsCatalogueService: HsCompositionsCatalogueService,
    public HsLaymanService: HsLaymanService
  ) {
    this.loaderImage = this.HsUtilsService.getAjaxLoaderIcon();
    this.loadFilteredCompositions = () =>
      HsCompositionsCatalogueService.loadFilteredCompositions();

    this.HsCompositionsService.notSavedCompositionLoading.subscribe((url) => {
      this.HsCompositionsService.compositionToLoad = {url, title: ''};
      this.loadUnsavedDialogBootstrap(url, '');
    });
  }

  hideNotLayman(composition: any): boolean {
    if (this.HsCompositionsCatalogueService.filterByOnlyMine) {
      if (composition.endpoint.type != 'layman') {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  resultsVisible(): boolean {
    if (
      this.HsCompositionsCatalogueService.listNext &&
      this.HsCompositionsCatalogueService.paging.matched
    ) {
      return true;
    } else {
      return false;
    }
  }
  nextPageAvailable(): boolean {
    return this.HsCompositionsCatalogueService.nextPageAvailable();
  }
  /**
   * @public
   * @description Load previous list of compositions to display on pager
   */
  getPreviousCompositions(): void {
    this.HsCompositionsCatalogueService.getPreviousCompositions();
  }

  /**
   * @public
   * @description Load next list of compositions to display on pager
   */
  getNextCompositions(): void {
    this.HsCompositionsCatalogueService.getNextCompositions();
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
    this.HsCompositionsCatalogueService.clearFilters();
  }
  changeUrlButtonVisible(): void {
    this.addCompositionUrlVisible = !this.addCompositionUrlVisible;
  }
  openSaveMapPanel(): void {
    this.HsLayoutService.setMainPanel('saveMap');
  }
  compositionClicked(composition): void {
    if (
      this.selectedCompId != this.HsCompositionsService.commonId(composition)
    ) {
      this.selectedCompId = this.HsCompositionsService.commonId(composition);
    } else {
      this.selectedCompId = '';
    }
  }
  reload(): void {
    this.clearFilters();
    this.loadFilteredCompositions();
  }
}
