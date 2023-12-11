import {Component, Input, OnInit, ViewChild} from '@angular/core';

import {HsConfig, HsConfigObject} from './config.service';

import {HsDrawToolbarComponent} from './components/draw/draw-toolbar/draw-toolbar.component';
import {HsExternalService} from './components/external/external.service';

import {HsGeolocationComponent} from './components/geolocation/geolocation.component';
import {HsInfoComponent} from './components/info/info.component';

import {HsLayerManagerGalleryComponent} from './components/layer-manager/gallery/layer-manager-gallery.component';
import {HsLayoutComponent} from './components/layout/layout.component';

import {HsMapSwipeService} from './components/map-swipe/map-swipe.service';

import {HsMeasureToolbarComponent} from './components/measure/measure-toolbar.component';

import {HsQueryPopupComponent} from './components/query/query-popup/query-popup.component';
import {HsQueryPopupService} from './components/query/query-popup.service';
import {HsQueryPopupWidgetContainerService} from './components/query/query-popup-widget-container.service';

import {HsSearchToolbarComponent} from './components/search/search-toolbar.component';
import {HsStylerComponent} from './components/styles/styler.component';
import {HsToolbarComponent} from './components/toolbar/toolbar.component';
import {HsToolbarPanelContainerService} from './components/toolbar/toolbar-panel-container.service';

import {HsOverlayPanelContainerService} from './components/layout/overlay-panel-container.service';
import {HsPanelConstructorService} from './components/layout/panels/panel-constructor.service';
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
    private HsOverlayPanelContainerService: HsOverlayPanelContainerService,
    private hsToolbarPanelContainerService: HsToolbarPanelContainerService,
    private hsQueryPopupService: HsQueryPopupService,
    private HsMapSwipeService: HsMapSwipeService, //Leave this, need to inject somewhere
    private hsQueryPopupWidgetContainerService: HsQueryPopupWidgetContainerService, //Leave this, need to inject somewhere
    private hsExternalService: HsExternalService, //Leave this, need to inject somewhere
    private HsPanelContainerService: HsPanelContainerService,
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
