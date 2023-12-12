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
import {HsLayerManagerComponent} from './components/layer-manager/layer-manager.component';
import {HsLayerManagerGalleryComponent} from './components/layer-manager/gallery/layer-manager-gallery.component';
import {HsLayerManagerService} from './components/layer-manager/layer-manager.service';
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
import {HsShareComponent} from './components/share/share.component';
import {HsStylerComponent} from './components/styler/styler.component';
import {HsToolbarComponent} from './components/toolbar/toolbar.component';
import {HsToolbarPanelContainerService} from './components/toolbar/toolbar-panel-container.service';
import {HsTripPlannerComponent} from './components/trip-planner/trip-planner.component';

import {
  HsAddDataCatalogueComponent,
  HsAddDataFileBaseComponent,
} from './public-api';

import {HsOverlayPanelContainerService} from './components/layout/overlay-panel-container.service';
import {HsPanelConstructorService} from './components/layout/panels/panel-constructor.service';

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
    private HsOverlayPanelContainerService: HsOverlayPanelContainerService,
    private hsToolbarPanelContainerService: HsToolbarPanelContainerService,
    private hsQueryPopupService: HsQueryPopupService,
    private HsMapSwipeService: HsMapSwipeService, //Leave this, need to inject somewhere
    private hsQueryPopupWidgetContainerService: HsQueryPopupWidgetContainerService, //Leave this, need to inject somewhere
    private hsExternalService: HsExternalService, //Leave this, need to inject somewhere
    private HsPanelConstructorService: HsPanelConstructorService,
  ) {}

  async ngOnInit(): Promise<void> {
    if (this.config) {
      this.hsConfig.update(this.config);
    }
    if (this.id) {
      this.hsConfig.setAppId(this.id);
    }

    /**
     * Create panel components
     */
    this.HsPanelConstructorService.createActivePanels();

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
