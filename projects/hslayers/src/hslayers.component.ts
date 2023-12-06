import {Component, Input, OnInit, Type, ViewChild} from '@angular/core';

import {HsAddDataComponent} from './components/add-data/add-data.component';
import {HsCompositionsComponent} from './components/compositions/compositions.component';
import {HsConfig, HsConfigObject} from './config.service';
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
import {HsQueryComponent} from './components/query/query.component';
import {HsQueryPopupComponent} from './components/query/query-popup/query-popup.component';
import {HsQueryPopupService} from './components/query/query-popup.service';
import {HsQueryPopupWidgetContainerService} from './components/query/query-popup-widget-container.service';
import {HsSaveMapComponent} from './components/save-map/save-map.component';
import {HsSearchComponent} from './components/search/search.component';
import {HsSearchToolbarComponent} from './components/search/search-toolbar.component';
import {HsShareComponent} from './components/permalink/share.component';
import {HsStylerComponent} from './components/styles/styler.component';
import {HsToolbarComponent} from './components/toolbar/toolbar.component';
import {HsToolbarPanelContainerService} from './components/toolbar/toolbar-panel-container.service';
import {HsTripPlannerComponent} from './components/trip-planner/trip-planner.component';

import {HsOverlayPanelContainerService} from './components/layout/overlay-panel-container.service';
import {HsPanelContainerService} from './components/layout/panels/panel-container.service';
import {HsSidebarService} from './components/sidebar/sidebar.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'hslayers',
  templateUrl: './hslayers.html',
  styles: [],
})
export class HslayersComponent implements OnInit {
  @Input() config: HsConfigObject;
  @Input() id: string;
  @ViewChild(HsLayoutComponent) layout: HsLayoutComponent;

  constructor(
    public hsConfig: HsConfig,
    private hsLayoutService: HsLayoutService,
    private HsLayerManagerService: HsLayerManagerService,
    private HsPanelContainerService: HsPanelContainerService,
    private HsOverlayPanelContainerService: HsOverlayPanelContainerService,
    private hsToolbarPanelContainerService: HsToolbarPanelContainerService,
    private hsQueryPopupService: HsQueryPopupService,
    private HsMapSwipeService: HsMapSwipeService, //Leave this, need to inject somewhere
    private hsQueryPopupWidgetContainerService: HsQueryPopupWidgetContainerService, //Leave this, need to inject somewhere
    private hsExternalService: HsExternalService, //Leave this, need to inject somewhere
    private hsSidebarService: HsSidebarService,
  ) {}

  /**
   * Check if panel is configured to be visible in hsConfig.panelsEnabled
   * or hsLayoutService.panelsEnabledDefaults and create one if so.
   * @param name - Name of panel used in panelsEnabled config
   * @param panelComponent - Class defining panel
   * @param data - Extra misc data object to be stored in panel
   */
  createPanel(name: string, panelComponent: Type<any>, data?: any): void {
    if (this.hsConfig == undefined || this.hsConfig.panelsEnabled[name]) {
      this.HsPanelContainerService.create(panelComponent, data || {});
    }
  }
  ngOnInit(): void {
    if (this.config) {
      this.hsConfig.update(this.config);
    }
    if (this.id) {
      this.hsConfig.setAppId(this.id);
    }

    const activePanels = Object.entries(this.hsConfig.panelsEnabled).reduce(
      (acc, [panel, isEnabled]) => (isEnabled ? [...acc, panel] : acc),
      [],
    );

    for (const panel of activePanels) {
      if (this.hsSidebarService.buttonDefinition[panel]) {
        this.hsSidebarService.addButton(
          this.hsSidebarService.buttonDefinition[panel],
        );
      }
    }

    this.createPanel('tripPlanner', HsTripPlannerComponent, {});
    this.createPanel('addData', HsAddDataComponent, {});
    this.createPanel('draw', HsDrawComponent, {});
    this.createPanel('search', HsSearchComponent, {});
    this.createPanel('feature_table', HsFeatureTableComponent, {});
    this.createPanel('saveMap', HsSaveMapComponent, {});
    this.createPanel('language', HsLanguageComponent, {});
    this.createPanel('info', HsQueryComponent, {});
    this.createPanel('permalink', HsShareComponent, {});
    this.createPanel('measure', HsMeasureComponent, {});
    this.createPanel('composition_browser', HsCompositionsComponent, {});
    this.createPanel('legend', HsLegendComponent, {});
    this.createPanel('layermanager', HsLayerManagerComponent, {});
    this.createPanel('mapSwipe', HsMapSwipeComponent, {});

    this.HsPanelContainerService.create(HsStylerComponent, {});

    this.hsToolbarPanelContainerService.create(HsSearchToolbarComponent, {});
    this.hsToolbarPanelContainerService.create(HsDrawToolbarComponent, {});
    this.hsToolbarPanelContainerService.create(HsMeasureToolbarComponent, {});

    this.HsOverlayPanelContainerService.create(HsGeolocationComponent, {});
    this.HsOverlayPanelContainerService.create(HsInfoComponent, {});
    this.HsOverlayPanelContainerService.create(
      HsLayerManagerGalleryComponent,
      {},
    );
    this.HsOverlayPanelContainerService.create(HsToolbarComponent, {});
    this.HsOverlayPanelContainerService.create(HsQueryPopupComponent, {
      service: this.hsQueryPopupService,
    });
  }
}
