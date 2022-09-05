import {AfterViewInit, Component} from '@angular/core';

import {
  HS_PRMS,
  HsCoreService,
  HsEventBusService,
  HsLayoutService,
  HsMapService,
  HsShareUrlService,
  HsSidebarService,
} from 'hslayers-ng';

import {HsCesiumService} from './hscesium.service';

@Component({
  selector: 'hs-cesium',
  templateUrl: './hscesium.html',
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
    public HsLayoutService: HsLayoutService //Used in template
  ) {}

  ngAfterViewInit(): void {
    //Timeout needed because view container might not
    //be resized yey and globe will be zoomed out in that case
    setTimeout(() => {
      this.HsCesiumService.init(this.app);
    }, 100);

    const view = this.HsShareUrlService.getParamValue(HS_PRMS.view);
    if (view != '2d') {
      this.HsShareUrlService.updateCustomParams({view: '3d'}, this.app);
      this.HsMapService.visible = false;
    } else {
      this.HsShareUrlService.updateCustomParams({view: '2d'}, this.app);
    }

    this.HsSidebarService.addButton(
      {
        title: '3D/2D',
        description: 'Switch between 3D (Cesium) and 2D (OpenLayers)',
        icon: 'icon-globealt',
        click: () => this.toggleCesiumMap(),
      },
      this.app
    );

    this.HsEventBusService.layermanagerDimensionChanges.subscribe((data) =>
      this.HsCesiumService.dimensionChanged(
        data.layer,
        data.dimension,
        this.app
      )
    );

    this.HsEventBusService.sizeChanges.subscribe((size) =>
      this.HsCesiumService.resize(size)
    );
    this.HsCesiumService.resize(this.app);
  }

  /**
   * Toggles between Cesium and OL maps by setting hs_map.visible variable which is monitored by ng-show. ng-show is set on map directive in map.js link function.
   */
  toggleCesiumMap() {
    this.HsMapService.visible = !this.HsMapService.visible;
    this.visible = !this.HsMapService.visible;
    this.HsShareUrlService.updateCustomParams(
      {
        view: this.HsMapService.visible ? '2d' : '3d',
      },
      this.app
    );
    if (this.HsMapService.visible) {
      this.HsCesiumService.get(this.app).viewer.destroy();
      this.HsCoreService.updateMapSize(this.app);
    } else {
      this.HsCesiumService.init(this.app);
    }
    this.HsEventBusService.mapLibraryChanges.next(
      this.visible ? 'cesium' : 'ol'
    );
  }
}
