import {Component, Input, OnInit, Type, ViewChild} from '@angular/core';

import {HsConfig, HsConfigObject} from './config.service';
// import {HsFeatureInfoComponent} from './components/query/query-popup-feature/feature-widgets/feature-info.component';
import {HsExternalService} from './components/external/external.service';
import {HsLayoutComponent} from './components/layout/layout.component';
import {HsMapSwipeService} from './components/map-swipe/map-swipe.service';
import {HsQueryPopupComponent} from './components/query/query-popup/query-popup.component';
import {HsQueryPopupService} from './components/query/query-popup.service';
import {HsQueryPopupWidgetContainerService} from './components/query/query-popup-widget-container.service';

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

    /**
     * Create GUI overlay
     */
    this.HsOverlayPanelContainerService.createGuiOverlay();

    this.HsOverlayPanelContainerService.create(HsQueryPopupComponent, {
      service: this.hsQueryPopupService,
    });
  }
}
