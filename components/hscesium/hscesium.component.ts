import {Component, OnInit} from '@angular/core';
import {HsCesiumService} from './hscesium.service';
import {HsCoreService} from '../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsSidebarService} from '../sidebar/sidebar.service';

@Component({
  selector: 'hs.cesium',
  template: require('./partials/cesium.html'),
})
export class HsCesiumComponent implements OnInit {
  visible = true;
  constructor(
    private HsCesiumService: HsCesiumService,
    private HsPermalinkUrlService: HsShareUrlService,
    private HsCoreService: HsCoreService,
    private HsMapService: HsMapService,
    private HsSidebarService: HsSidebarService,
    private HsEventBusService: HsEventBusService,
    private HsLayoutService: HsLayoutService //Used in template
  ) {}

  ngOnInit(): void {
    this.HsCesiumService.init();
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

    this.HsEventBusService.layermanagerDimensionChanges.subscribe((data) =>
      this.HsCesiumService.dimensionChanged(data.layer, data.dimension)
    );

    this.HsEventBusService.sizeChanges.subscribe((size) =>
      this.HsCesiumService.resize(size)
    );
    this.HsCesiumService.resize();
  }

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
