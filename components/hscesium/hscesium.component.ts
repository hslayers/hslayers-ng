import {Component} from '@angular/core';
import {HsCesiumService} from './hscesium.service';
import {HsCoreService} from '../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsMapService} from '../map/map.service';

@Component({
  selector: 'hs.cesium',
  template: require('./partials/cesium.html'),
})
export class HsCesiumComponent {
  visible = true;
  constructor(
    private HsCesiumService: HsCesiumService,
    private HsPermalinkUrlService: HsPermalinkUrlService,
    private HsCoreService: HsCoreService,
    private HsMapService: HsMapService,
    private HsSidebarService: HsSidebarService,
    private HsEventBusService: HsEventBusService
  ) {}

  /**
   * @ngdoc method
   * @name HsCesiumController#toggleCesiumMap
   * @private
   * @description Toggles between Cesium and OL maps by setting hs_map.visible variable which is monitored by ng-show. ng-show is set on map directive in map.js link function.
   */
  toggleCesiumMap() {
    this.HsMapService.visible = !this.HsMapService.visible;
    this.visible = !this.HsMapService.visible;
    this.HsPermalinkUrlService.updateCustomParams({
      view: HsMapService.visible ? '2d' : '3d',
    });
    if (HsMapService.visible) {
      this.HsCesiumService.viewer.destroy();
      setTimeout(() => {
        this.HsCoreService.updateMapSize();
      }, 5000);
    } else {
      this.HsCesiumService.init();
    }
    this.HsEventBusService.mapLibraryChanges.next(
      this.visible ? 'cesium' : 'ol'
    );
  }

  init() {
    this.HsCesiumService.init();
    const view = this.HsPermalinkUrlService.getParamValue('view');
    if (view != '2d' || view == '3d') {
      this.HsPermalinkUrlService.updateCustomParams({view: '3d'});
      setTimeout(() => {
        HsMapService.visible = false;
      }, 0);
    } else {
      this.HsPermalinkUrlService.updateCustomParams({view: '2d'});
    }

    this.HsSidebarService.extraButtons.push({
      title: '3D/2D',
      icon_class: 'icon-globealt',
      click: () => this.toggleCesiumMap(),
    });

    this.HsEventBusService.layermanagerDimensionChanges.subscribe((data) =>
      this.HsCesiumService.dimensionChanged(data.layer, data.dimension)
    );

    this.HsEventBusService.sizeChanges.subscribe((size) =>
      this.HsCesiumService.resize(size)
    );
    this.HsCesiumService.resize();
  }
}
