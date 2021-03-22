import {AfterViewInit, Component, OnDestroy} from '@angular/core';

import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {
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
export class HslayersCesiumComponent implements AfterViewInit, OnDestroy {
  visible = true;
  private ngUnsubscribe = new Subject();
  constructor(
    public HsCesiumService: HsCesiumService,
    public HsPermalinkUrlService: HsShareUrlService,
    public HsCoreService: HsCoreService,
    public HsMapService: HsMapService,
    public HsSidebarService: HsSidebarService,
    public HsEventBusService: HsEventBusService,
    public HsLayoutService: HsLayoutService //Used in template
  ) {}
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngAfterViewInit(): void {
    //Timeout needed because view container might not
    //be resized yey and globe will be zoomed out in that case
    setTimeout(() => {
      this.HsCesiumService.init();
    }, 100);

    const view = this.HsPermalinkUrlService.getParamValue('view');
    if (view != '2d') {
      this.HsPermalinkUrlService.updateCustomParams({view: '3d'});
      this.HsMapService.visible = false;
    } else {
      this.HsPermalinkUrlService.updateCustomParams({view: '2d'});
    }

    this.HsSidebarService.buttons.push({
      title: '3D/2D',
      description: 'Switch between 3D (Cesium) and 2D (OpenLayers)',
      icon: 'icon-globealt',
      click: () => this.toggleCesiumMap(),
    });

    this.HsEventBusService.layermanagerDimensionChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data) =>
        this.HsCesiumService.dimensionChanged(data.layer, data.dimension)
      );

    this.HsEventBusService.sizeChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((size) => this.HsCesiumService.resize(size));

    this.HsCesiumService.resize();
  }

  /**
   * Toggles between Cesium and OL maps by setting hs_map.visible variable which is monitored by ng-show. ng-show is set on map directive in map.js link function.
   */
  toggleCesiumMap(): void {
    this.HsMapService.visible = !this.HsMapService.visible;
    this.visible = !this.HsMapService.visible;
    this.HsPermalinkUrlService.updateCustomParams({
      view: this.HsMapService.visible ? '2d' : '3d',
    });
    if (this.HsMapService.visible) {
      this.HsCesiumService.viewer.destroy();
      this.HsCoreService.updateMapSize();
    } else {
      this.HsCesiumService.init();
    }
    this.HsEventBusService.mapLibraryChanges.next(
      this.visible ? 'cesium' : 'ol'
    );
  }
}
