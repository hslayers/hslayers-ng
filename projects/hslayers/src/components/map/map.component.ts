import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';

import Map from 'ol/Map';
import {transform} from 'ol/proj';

import {HsConfig} from '../../config.service';
import {HsCoreService} from '../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsMapService} from './map.service';
import {HsShareUrlService} from '../permalink/share-url.service';

@Component({
  selector: 'hs-map',
  templateUrl: './partials/map.html',
})
export class HsMapComponent implements AfterViewInit {
  @ViewChild('map') map: ElementRef;
  unregisterMapSyncCenterHandler: any;
  constructor(
    public HsMapService: HsMapService,
    public HsPermalinkUrlService: HsShareUrlService,
    public HsCoreService: HsCoreService,
    public HsConfig: HsConfig,
    public HsEventBusService: HsEventBusService
  ) {
    this.unregisterMapSyncCenterHandler = this.HsEventBusService.mapCenterSynchronizations.subscribe(
      (data) => {
        this.onCenterSync(data);
      }
    );
  }
  ngAfterViewInit() {
    this.HsMapService.mapElement = this.map.nativeElement;

    if (this.HsPermalinkUrlService.getParamValue('visible_layers')) {
      const visibleLayersParam = this.HsPermalinkUrlService.getParamValue(
        'visible_layers'
      );
      this.HsMapService.visibleLayersInUrl = visibleLayersParam.split(';');
    }
    this.HsMapService.init();
    const hs_x = this.HsPermalinkUrlService.getParamValue('hs_x');
    const hs_y = this.HsPermalinkUrlService.getParamValue('hs_y');
    const hs_z = this.HsPermalinkUrlService.getParamValue('hs_z');
    if (
      hs_x &&
      hs_x != 'NaN' &&
      hs_y &&
      hs_y != 'NaN' &&
      hs_z &&
      hs_z != 'NaN'
    ) {
      this.HsMapService.moveToAndZoom(
        parseFloat(hs_x),
        parseFloat(hs_y),
        parseInt(hs_z)
      );
    }

    if (
      this.HsPermalinkUrlService.getParamValue('puremap') ||
      this.HsConfig.pureMap == true
    ) {
      this.HsCoreService.puremapApp = true;
    }
    this.HsMapService.map.updateSize();
  }

  ngOnDestroy() {
    if (this.unregisterMapSyncCenterHandler) {
      this.unregisterMapSyncCenterHandler.unsubscribe();
    }
  }
  /**
   * @ngdoc method
   * @name HsMapController#onCenterSync
   * @private
   * @param {event} event Info about angularjs broadcasted event
   * @param {Array} data Coordinates in lon/lat and resolution
   * @description This gets called from Cesium map, to
   * synchronize center and resolution between Ol and Cesium maps
   */
  onCenterSync(data?) {
    const center = data.center;
    if (!center) {
      return;
    }
    const toProj = this.HsMapService.map.getView().getProjection();
    const transformed = transform([center[0], center[1]], 'EPSG:4326', toProj);
    this.HsMapService.moveToAndZoom(
      transformed[0],
      transformed[1],
      this.zoomForResolution(center[2])
    );
  }

  /**
   * @ngdoc method
   * @name HsMapController#zoomForResolution
   * @private
   * @param {number} resolution Resolution
   * @description Calculates zoom level for a given resolution
   * @returns {number} Zoom level for resolution. If resolution
   * was greater than 156543.03390625 return 0
   */
  zoomForResolution(resolution) {
    let zoom = 0;
    //Sometimes resolution is under 0. Ratis
    resolution = Math.abs(resolution);
    let r = 156543.03390625; // resolution for zoom 0
    while (resolution < r) {
      r /= 2.0;
      zoom++;
      if (resolution > r) {
        return zoom;
      }
    }
    return zoom; // resolution was greater than 156543.03390625 so return 0
  }
}
