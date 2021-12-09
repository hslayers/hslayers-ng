import {Component, Input, OnInit, Type, ViewChild} from '@angular/core';

import {HsAddDataComponent} from './components/add-data/add-data.component';
import {HsCompositionsComponent} from './components/compositions/compositions.component';
import {HsConfig} from './config.service';
import {HsDrawComponent} from './components/draw/draw.component';
import {HsDrawToolbarComponent} from './components/draw/draw-toolbar/draw-toolbar.component';
// import {HsFeatureInfoComponent} from './components/query/query-popup-feature/feature-widgets/feature-info.component';
import {HsExternalService} from './components/external/external.service';
import {HsFeatureTableComponent} from './components/feature-table/feature-table.component';
import {HsGeolocationComponent} from './components/geolocation/geolocation.component';
import {HsInfoComponent} from './components/info/info.component';
import {HsLanguageComponent} from './components/language/language.component';
import {HsLayerManagerComponent} from './components/layermanager/layermanager.component';
import {HsLayerManagerGalleryComponent} from './components/layermanager/gallery/layermanager-gallery.component';
import {HsLayerManagerService} from './components/layermanager/layermanager.service';
import {HsLayoutComponent} from './components/layout/layout.component';
import {HsLayoutService} from './components/layout/layout.service';
import {HsLegendComponent} from './components/legend/legend.component';
import {HsMapSwipeComponent} from './components/map-swipe/map-swipe.component';
import {HsMapSwipeService} from './components/map-swipe/map-swipe.service';
import {HsMeasureComponent} from './components/measure/measure.component';
import {HsMeasureToolbarComponent} from './components/measure/measure-toolbar.component';
import {HsPrintComponent} from './components/print/print.component';
import {HsQueryComponent} from './components/query/query.component';
import {HsQueryPopupComponent} from './components/query/query-popup/query-popup.component';
import {HsQueryPopupService} from './components/query/query-popup.service';
import {HsSaveMapComponent} from './components/save-map/save-map.component';
import {HsSearchComponent} from './components/search/search.component';
import {HsSearchToolbarComponent} from './components/search/search-toolbar.component';
import {HsShareComponent} from './components/permalink/share.component';
import {HsStylerComponent} from './components/styles/styler.component';
import {HsToolbarComponent} from './components/toolbar/toolbar.component';
import {HsToolbarPanelContainerService} from './components/toolbar/toolbar-panel-container.service';
import {HsTripPlannerComponent} from './components/trip-planner/trip-planner.component';
import {HsQueryPopupWidgetContainerService} from './components/query/query-popup-widget-container.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'hslayers',
  templateUrl: './hslayers.html',
  styles: [],
})
export class HslayersComponent implements OnInit {
  @Input() config: HsConfig;
  @ViewChild(HsLayoutComponent) layout: HsLayoutComponent;

  constructor(
    public hsConfig: HsConfig,
    private hsLayoutService: HsLayoutService,
    private HsLayerManagerService: HsLayerManagerService,
    private hsToolbarPanelContainerService: HsToolbarPanelContainerService,
    private hsQueryPopupService: HsQueryPopupService,
    private HsMapSwipeService: HsMapSwipeService,
    private hsQueryPopupWidgetContainerService: HsQueryPopupWidgetContainerService,
    hsExternalService: HsExternalService
  ) {}

  /**
   * Check if panel is configured to be visible in hsConfig.panelsEnabled
   * or hsLayoutService.panelsEnabledDefaults and create one if so.
   * @param name - Name of panel used in panelsEnabled config
   * @param panelComponent - Class defining panel
   * @param data - Extra misc data object to be stored in panel
   */
  createPanel(name: string, panelComponent: Type<any>, data?: any): void {
    let panelsEnabled = this.hsConfig.panelsEnabled;
    if (panelsEnabled == undefined || panelsEnabled[name] == undefined) {
      panelsEnabled = this.hsLayoutService.panelsEnabledDefaults;
    }
    if (panelsEnabled[name]) {
      this.hsLayoutService.createPanel(panelComponent, data || {});
    }
  }
  ngOnInit(): void {
    if (this.config) {
      this.hsConfig.update(this.config);
    }
    if (!this.hsLayoutService.initializedOnce) {
      this.createPanel('tripPlanner', HsTripPlannerComponent);
      this.createPanel('addData', HsAddDataComponent);
      this.createPanel('draw', HsDrawComponent);
      this.createPanel('search', HsSearchComponent);
      this.createPanel('feature_table', HsFeatureTableComponent);
      this.createPanel('saveMap', HsSaveMapComponent);
      this.createPanel('language', HsLanguageComponent);
      this.createPanel('info', HsQueryComponent);
      this.createPanel('permalink', HsShareComponent);
      this.createPanel('print', HsPrintComponent);
      this.createPanel('measure', HsMeasureComponent);
      this.createPanel('composition_browser', HsCompositionsComponent);
      this.createPanel('legend', HsLegendComponent);
      this.createPanel(
        'layermanager',
        HsLayerManagerComponent,
        this.HsLayerManagerService.data
      );
      this.createPanel('mapSwipe', HsMapSwipeComponent);
      this.hsLayoutService.createPanel(HsStylerComponent, {});
      this.hsToolbarPanelContainerService.create(HsSearchToolbarComponent, {});
      this.hsToolbarPanelContainerService.create(HsDrawToolbarComponent, {});
      this.hsToolbarPanelContainerService.create(HsMeasureToolbarComponent, {});
      this.hsLayoutService.createOverlay(HsGeolocationComponent, {});
      this.hsLayoutService.createOverlay(HsInfoComponent, {});
      this.hsLayoutService.createOverlay(HsLayerManagerGalleryComponent, {});
      this.hsLayoutService.createOverlay(HsToolbarComponent, {});
      this.hsLayoutService.createOverlay(HsQueryPopupComponent, {
        service: this.hsQueryPopupService,
      });
      this.hsLayoutService.initializedOnce = true;
    }
  }
}
