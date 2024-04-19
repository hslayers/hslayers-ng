import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import {CommonModule} from '@angular/common';

import {Subscription} from 'rxjs';
import {transform} from 'ol/proj';

import {HS_PRMS, HsShareUrlService} from 'hslayers-ng/services/share';
import {HsConfig} from 'hslayers-ng/config';
import {HsCoreService} from '../core.service';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsMapDirective} from './map.directive';
import {HsMapService} from 'hslayers-ng/services/map';

@Component({
  selector: 'hs-map',
  templateUrl: './map.component.html',
  standalone: true,
  imports: [CommonModule, HsMapDirective],
})
export class HsMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('map') map: ElementRef;

  unregisterMapSyncCenterHandlerSubscription: Subscription;
  constructor(
    public HsMapService: HsMapService,
    public HsCoreService: HsCoreService,
    public HsConfig: HsConfig,
    public HsEventBusService: HsEventBusService,
    private HsLayoutService: HsLayoutService,
    private HsShareUrlService: HsShareUrlService,
    private zone: NgZone,
  ) {
    this.unregisterMapSyncCenterHandlerSubscription =
      this.HsEventBusService.mapCenterSynchronizations.subscribe((data) => {
        this.onCenterSync(data);
      });
  }

  ngAfterViewInit(): void {
    const visibleLayersParam = this.HsShareUrlService.getParamValue(
      HS_PRMS.visibleLayers,
    );
    this.HsMapService.permalink = this.HsShareUrlService.getParamValue(
      HS_PRMS.permalink,
    );
    this.HsMapService.externalCompositionId =
      this.HsShareUrlService.getParamValue(HS_PRMS.composition) ||
      this.HsConfig.defaultComposition;

    if (visibleLayersParam) {
      this.HsMapService.visibleLayersInUrl = visibleLayersParam.split(';');
    }

    this.zone.runOutsideAngular(() =>
      this.HsMapService.init(this.map.nativeElement),
    );

    if (
      this.HsShareUrlService.getParamValue(HS_PRMS.pureMap) ||
      this.HsConfig.pureMap == true
    ) {
      this.HsLayoutService.puremapApp = true;
    }

    this.HsMapService.getMap().updateSize();
  }

  ngOnDestroy(): void {
    this.unregisterMapSyncCenterHandlerSubscription.unsubscribe();
    this.HsMapService.getMap().getInteractions().clear();
  }

  /**
   * This gets called from Cesium map, to
   * synchronize center and resolution between Ol and Cesium maps
   * @param data - Coordinates in lon/lat and resolution
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
      this.zoomForResolution(center[2]),
    );
  }

  /**
   * Calculates zoom level for a given resolution
   * @param resolution - Resolution
   * @returns Zoom level for resolution. If resolution
   * was greater than 156543.03390625 return 0
   */
  zoomForResolution(resolution) {
    let zoom = 0;
    //Sometimes resolution is under 0.
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
