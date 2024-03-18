import {AfterViewInit, Component} from '@angular/core';

import {HS_PRMS, HsShareUrlService} from 'hslayers-ng/components/share';
import {HsCoreService} from 'hslayers-ng/services/core';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsSidebarService} from 'hslayers-ng/services/sidebar';

import {HsCesiumService} from './hscesium.service';

@Component({
  selector: 'hs-cesium',
  templateUrl: './hscesium.component.html',
})
export class HslayersCesiumComponent implements AfterViewInit {
  visible = true;
  app = 'default';
  constructor(
    public HsCesiumService: HsCesiumService,
    public HsShareUrlService: HsShareUrlService,
    public HsCoreService: HsCoreService,
    public HsMapService: HsMapService,
    public HsSidebarService: HsSidebarService,
    public HsEventBusService: HsEventBusService,
    public HsLayoutService: HsLayoutService,
  ) {}

  ngAfterViewInit(): void {
    //Timeout needed because view container might not
    //be resized yet and globe will be zoomed out in that case
    setTimeout(() => {
      this.HsCesiumService.init();
    }, 100);

    const view = this.HsShareUrlService.getParamValue(HS_PRMS.view);
    if (view != '2d') {
      this.HsShareUrlService.updateCustomParams({view: '3d'});
      this.HsMapService.visible = false;
    } else {
      this.HsShareUrlService.updateCustomParams({view: '2d'});
    }

    this.HsSidebarService.addButton({
      title: '3D/2D',
      description: 'Switch between 3D (Cesium) and 2D (OpenLayers)',
      icon: 'icon-globealt',
      click: () => this.toggleCesiumMap(),
      order: -1,
    });

    this.HsEventBusService.layermanagerDimensionChanges.subscribe((data) =>
      this.HsCesiumService.dimensionChanged(data.layer, data.dimension),
    );

    this.HsEventBusService.sizeChanges.subscribe((size) =>
      this.HsCesiumService.resize(size),
    );
    this.HsCesiumService.resize();
  }

  /**
   * Toggles between Cesium and OL maps by setting HsMapService.visible property which is monitored by ngIf.
   */
  toggleCesiumMap() {
    this.HsMapService.visible = !this.HsMapService.visible;
    this.visible = !this.HsMapService.visible;
    this.HsShareUrlService.updateCustomParams({
      view: this.HsMapService.visible ? '2d' : '3d',
    });
    if (this.HsMapService.visible) {
      this.HsCesiumService.cesiumDisabled();
      this.HsCoreService.updateMapSize();
    } else {
      this.HsCesiumService.init();
    }
    this.HsEventBusService.mapLibraryChanges.next(
      this.visible ? 'cesium' : 'ol',
    );
  }
}
