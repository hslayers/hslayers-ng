import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';

import {Subscription} from 'rxjs';

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
export class HsMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('map') map: ElementRef;
  unregisterMapSyncCenterSubscription: Subscription;
  constructor(
    public HsMapService: HsMapService,
    public HsPermalinkUrlService: HsShareUrlService,
    public HsCoreService: HsCoreService,
    public HsConfig: HsConfig,
    public HsEventBusService: HsEventBusService,
    private zone: NgZone
  ) {
    this.unregisterMapSyncCenterSubscription = this.HsEventBusService.mapCenterSynchronizations.subscribe(
      (data) => {
        this.onCenterSync(data);
      }
    );
  }
  ngAfterViewInit(): void {
    this.HsMapService.mapElement = this.map.nativeElement;

    if (this.HsPermalinkUrlService.getParamValue('visible_layers')) {
      const visibleLayersParam = this.HsPermalinkUrlService.getParamValue(
        'visible_layers'
      );
      this.HsMapService.visibleLayersInUrl = visibleLayersParam.split(';');
    }
    this.zone.runOutsideAngular(() => this.HsMapService.init());
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

  ngOnDestroy(): void {
    this.unregisterMapSyncCenterSubscription.unsubscribe();
  }
  /**
   * @param event Info about angularjs broadcasted event
   * @param data Coordinates in lon/lat and resolution
   * This gets called from Cesium map, to
   * synchronize center and resolution between Ol and Cesium maps
   */
  onCenterSync(data?) {
    const center = data.center;
    if (!center) {
      return;
    }
    const toProj = this.HsMapService.getCurrentProj();
    const transformed = transform([center[0], center[1]], 'EPSG:4326', toProj);
    this.HsMapService.moveToAndZoom(
      transformed[0],
      transformed[1],
      this.zoomForResolution(center[2])
    );
  }

  /**
   * @param resolution Resolution
   * Calculates zoom level for a given resolution
   * @return Zoom level for resolution. If resolution
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
