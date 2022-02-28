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
  providers: [
    HsPanelContainerService,
    HsOverlayPanelContainerService,
    HsToolbarPanelContainerService,
  ],
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
  createPanel(name: string, panelComponent: Type<any>, data?: any): void {
    if (this.hsConfig.apps[this.id].panelsEnabled[name]) {
      this.HsPanelContainerService.create(panelComponent, data || {});
    }
  }
  ngOnInit(): void {
    if (this.config) {
      this.hsConfig.update(this.config, this.id);
    }
    if (this.id == undefined) {
      this.id = 'default';
    }
    this.createPanel('tripPlanner', HsTripPlannerComponent, {app: this.id});
    this.createPanel('addData', HsAddDataComponent, {app: this.id});
    this.createPanel('draw', HsDrawComponent, {app: this.id});
    this.createPanel('search', HsSearchComponent, {app: this.id});
    this.createPanel('feature_table', HsFeatureTableComponent, {app: this.id});
    this.createPanel('saveMap', HsSaveMapComponent, {app: this.id});
    this.createPanel('language', HsLanguageComponent, {app: this.id});
    this.createPanel('info', HsQueryComponent, {app: this.id});
    this.createPanel('permalink', HsShareComponent, {app: this.id});
    this.createPanel('print', HsPrintComponent, {app: this.id});
    this.createPanel('measure', HsMeasureComponent, {app: this.id});
    this.createPanel('composition_browser', HsCompositionsComponent, {
      app: this.id,
    });
    this.createPanel('legend', HsLegendComponent, {app: this.id});
    this.createPanel('layermanager', HsLayerManagerComponent, {app: this.id});
    this.createPanel('mapSwipe', HsMapSwipeComponent, {app: this.id});

    this.HsPanelContainerService.create(HsStylerComponent, {app: this.id});

    this.hsToolbarPanelContainerService.create(HsSearchToolbarComponent, {
      app: this.id,
    });
    this.hsToolbarPanelContainerService.create(HsDrawToolbarComponent, {
      app: this.id,
    });
    this.hsToolbarPanelContainerService.create(HsMeasureToolbarComponent, {
      app: this.id,
    });

    this.HsOverlayPanelContainerService.create(HsGeolocationComponent, {
      app: this.id,
    });
    this.HsOverlayPanelContainerService.create(HsInfoComponent, {app: this.id});
    this.HsOverlayPanelContainerService.create(HsLayerManagerGalleryComponent, {
      app: this.id,
    });
    this.HsOverlayPanelContainerService.create(HsToolbarComponent, {
      app: this.id,
    });
    this.HsOverlayPanelContainerService.create(HsQueryPopupComponent, {
      service: this.hsQueryPopupService,
      app: this.id,
    });
    this.hsExternalService.init(this.id);
    this.hsQueryPopupService.init(this.id);
  }
}
