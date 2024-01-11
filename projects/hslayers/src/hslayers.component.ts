import {Component, Input, OnInit, ViewChild} from '@angular/core';

import {HsConfig, HsConfigObject} from 'hslayers-ng/config';
import {HsExternalService} from 'hslayers-ng/shared/external';
import {HsLayoutComponent} from 'hslayers-ng/components/layout';
import {HsMapSwipeService} from 'hslayers-ng/components/map-swipe';
import {HsQueryPopupComponent} from 'hslayers-ng/components/query';
import {HsQueryPopupService} from 'hslayers-ng/components/query';
import {HsQueryPopupWidgetContainerService} from 'hslayers-ng/components/query';

import {HsOverlayConstructorService} from 'hslayers-ng/shared/panel-constructor';
import {HsPanelConstructorService} from 'hslayers-ng/shared/panel-constructor';

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
    private HsOverlayConstructorService: HsOverlayConstructorService,
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
    this.HsOverlayConstructorService.createGuiOverlay();

    this.HsOverlayConstructorService.create(HsQueryPopupComponent, {
      service: this.hsQueryPopupService,
    });
  }
}
