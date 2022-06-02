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
import {HsPrintComponent} from './components/print/print.component';
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
    private hsExternalService: HsExternalService //Leave this, need to inject somewhere
  ) {}

  /**
   * Check if panel is configured to be visible in hsConfig.get(app).panelsEnabled
   * or hsLayoutService.panelsEnabledDefaults and create one if so.
   * @param name - Name of panel used in panelsEnabled config
   * @param panelComponent - Class defining panel
   * @param data - Extra misc data object to be stored in panel
   */
  createPanel(
    name: string,
    panelComponent: Type<any>,
    app: string,
    data?: any
  ): void {
    if (
      this.hsConfig.apps[this.id] == undefined ||
      this.hsConfig.apps[this.id].panelsEnabled[name]
    ) {
      this.HsPanelContainerService.create(panelComponent, data || {}, app);
    }
  }
  ngOnInit(): void {
    if (this.config) {
      this.hsConfig.update(this.config, this.id);
    }
    if (this.id == undefined) {
      this.id = 'default';
    }
    this.createPanel('tripPlanner', HsTripPlannerComponent, this.id, {});
    this.createPanel('addData', HsAddDataComponent, this.id, {});
    this.createPanel('draw', HsDrawComponent, this.id, {});
    this.createPanel('search', HsSearchComponent, this.id, {});
    this.createPanel('feature_table', HsFeatureTableComponent, this.id, {});
    this.createPanel('saveMap', HsSaveMapComponent, this.id, {});
    this.createPanel('language', HsLanguageComponent, this.id, {});
    this.createPanel('info', HsQueryComponent, this.id, {});
    this.createPanel('permalink', HsShareComponent, this.id, {});
    this.createPanel('print', HsPrintComponent, this.id, {});
    this.createPanel('measure', HsMeasureComponent, this.id, {});
    this.createPanel(
      'composition_browser',
      HsCompositionsComponent,
      this.id,
      {}
    );
    this.createPanel('legend', HsLegendComponent, this.id, {});
    this.createPanel('layermanager', HsLayerManagerComponent, this.id, {});
    this.createPanel('mapSwipe', HsMapSwipeComponent, this.id, {});

    this.HsPanelContainerService.create(HsStylerComponent, {}, this.id);

    this.hsToolbarPanelContainerService.create(
      HsSearchToolbarComponent,
      {},
      this.id
    );
    this.hsToolbarPanelContainerService.create(
      HsDrawToolbarComponent,
      {},
      this.id
    );
    this.hsToolbarPanelContainerService.create(
      HsMeasureToolbarComponent,
      {},
      this.id
    );

    this.HsOverlayPanelContainerService.create(
      HsGeolocationComponent,
      {},
      this.id
    );
    this.HsOverlayPanelContainerService.create(HsInfoComponent, {}, this.id);
    this.HsOverlayPanelContainerService.create(
      HsLayerManagerGalleryComponent,
      {},
      this.id
    );
    this.HsOverlayPanelContainerService.create(HsToolbarComponent, {}, this.id);
    this.hsQueryPopupService.init(this.id);
    this.HsOverlayPanelContainerService.create(
      HsQueryPopupComponent,
      {
        service: this.hsQueryPopupService,
      },
      this.id
    );
    this.hsExternalService.init(this.id);
  }
}
