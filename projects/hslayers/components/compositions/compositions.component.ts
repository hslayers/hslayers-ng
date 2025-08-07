import {Component, computed, OnInit, signal, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {filter} from 'rxjs/operators';

import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsCompositionsCatalogueService} from './compositions-catalogue.service';
import {HsCompositionsMapService} from './compositions-map.service';
import {HsCompositionsParserService} from 'hslayers-ng/services/compositions';
import {HsCompositionsService} from './compositions.service';
import {HsConfig} from 'hslayers-ng/config';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsLayerSynchronizerService} from 'hslayers-ng/services/save-map';
import {HsMapCompositionDescriptor} from 'hslayers-ng/types';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsCommonEndpointsService} from 'hslayers-ng/services/endpoints';

@Component({
  selector: 'hs-compositions',
  templateUrl: './compositions.component.html',
  standalone: false,
})
export class HsCompositionsComponent
  extends HsPanelBaseComponent
  implements OnInit
{
  hsConfig = inject(HsConfig);
  private hsEventBusService = inject(HsEventBusService);
  private hsCompositionsService = inject(HsCompositionsService);
  private hsCompositionsParserService = inject(HsCompositionsParserService);
  private hsCompositionsMapService = inject(HsCompositionsMapService);
  private hsDialogContainerService = inject(HsDialogContainerService);
  hsCompositionsCatalogueService = inject(HsCompositionsCatalogueService);
  hsCommonLaymanService = inject(HsCommonLaymanService);
  private hsCommonEndpointsService = inject(HsCommonEndpointsService);
  /*
   * Make sure the hsLayerSynchronizerService is available in the setups with add-data
   */
  private hsLayerSynchronizerService = inject(HsLayerSynchronizerService);

  keywordsVisible = false;
  themesVisible = false;
  urlToAdd = '';
  addCompositionUrlVisible = false;

  optionsMenuOpen = signal(false);
  optionsButtonLabel = computed(() =>
    this.optionsMenuOpen() ? 'less' : 'more',
  );
  selectedCompId: string;
  loadFilteredCompositions: any;
  name = 'compositions';

  constructor() {
    super();

    this.hsEventBusService.vectorQueryFeatureSelection
      .pipe(
        filter((e) => this.hsLayoutService.mainpanel == 'compositions'),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        for (const endpoint of this.hsCommonEndpointsService.endpoints()) {
          const record =
            this.hsCompositionsMapService.getFeatureRecordAndUnhighlight(
              e.feature,
              e.selector,
              endpoint.compositions,
            );
          if (record) {
            this.hsCompositionsService.loadComposition(
              this.hsCompositionsService.getRecordLink(record),
            );
          }
        }
      });
  }

  ngOnInit(): void {
    this.loadFilteredCompositions = () =>
      this.hsCompositionsCatalogueService.loadFilteredCompositions();
    this.hsCompositionsService.notSavedOrEditedCompositionLoading
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({url, record}) => {
        this.hsCompositionsService.compositionToLoad = {
          url,
          title: record.title,
        };
        this.loadUnsavedDialogBootstrap(record);
      });
    super.ngOnInit();
  }

  /**
   * @param composition - Composition to highlight
   * @param state - Target state of composition ( True - highlighted, False - normal)
   * Highlight (or dim) composition, toggle visual state of composition extent on map
   */
  highlightComposition(
    composition: HsMapCompositionDescriptor,
    state: boolean,
  ): void {
    composition.highlighted = state;
    this.hsCompositionsMapService.highlightComposition(composition, state);
  }

  /**
   
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
      this.hsCompositionsService.loadComposition(url, true).then(() => {
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
          true,
        );
      };
      reader.readAsText(f);
    }
  }

  /**
   * Open overwrite dialog
   * @param title - Dialog title
   */
  async loadUnsavedDialogBootstrap(record: any): Promise<void> {
    const {HsCompositionsOverwriteDialogComponent} = await import(
      './dialogs/overwrite-dialog.component'
    );

    this.hsDialogContainerService.create(
      HsCompositionsOverwriteDialogComponent,
      record,
    );
  }

  /**
   * Open options menu
   */
  openOptionsMenu(): void {
    this.optionsMenuOpen.update((value) => !value);
    if (this.optionsMenuOpen()) {
      this.keywordsVisible = false;
      this.themesVisible = false;
    }
  }

  /**
   * Clear all options menu filters
   */
  clearFilters(): void {
    this.optionsMenuOpen.set(false);
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
   * Get save map panel status
   */
  saveMapAvailable(): boolean {
    return this.hsLayoutService.panelEnabled('saveMap');
  }
}
