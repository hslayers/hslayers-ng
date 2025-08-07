import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';

import {Subscription} from 'rxjs';
import {transform} from 'ol/proj';

import {HS_PRMS, HsShareUrlService} from 'hslayers-ng/services/share';
import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsMapDirective} from './map.directive';
import {HsMapService} from 'hslayers-ng/services/map';
import {HslayersService} from '../hslayers.service';

@Component({
  selector: 'hs-map',
  templateUrl: './map.component.html',
  imports: [HsMapDirective],
})
export class HsMapComponent implements AfterViewInit, OnDestroy {
  hsMapService = inject(HsMapService);
  hslayersService = inject(HslayersService);
  hsConfig = inject(HsConfig);
  hsEventBusService = inject(HsEventBusService);
  private hsLayoutService = inject(HsLayoutService);
  private hsShareUrlService = inject(HsShareUrlService);
  private zone = inject(NgZone);

  @ViewChild('map') map: ElementRef;

  unregisterMapSyncCenterHandlerSubscription: Subscription;

  constructor() {
    this.unregisterMapSyncCenterHandlerSubscription =
      this.hsEventBusService.mapCenterSynchronizations.subscribe((data) => {
        this.onCenterSync(data);
      });
  }

  ngAfterViewInit(): void {
    const visibleLayersParam = this.hsShareUrlService.getParamValue(
      HS_PRMS.visibleLayers,
    );
    this.hsMapService.permalink = this.hsShareUrlService.getParamValue(
      HS_PRMS.permalink,
    );
    this.hsMapService.externalCompositionId =
      this.hsShareUrlService.getParamValue(HS_PRMS.composition) ||
      this.hsConfig.defaultComposition;

    if (visibleLayersParam) {
      this.hsMapService.visibleLayersInUrl = visibleLayersParam.split(';');
    }

    this.zone.runOutsideAngular(() =>
      this.hsMapService.init(this.map.nativeElement),
    );

    if (
      this.hsShareUrlService.getParamValue(HS_PRMS.pureMap) ||
      this.hsConfig.pureMap == true
    ) {
      this.hsLayoutService.puremapApp = true;
    }

    this.hsMapService.getMap().updateSize();
  }

  ngOnDestroy(): void {
    this.unregisterMapSyncCenterHandlerSubscription.unsubscribe();
    this.hsMapService.getMap().getInteractions().clear();
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
    const toProj = this.hsMapService.getCurrentProj();
    const transformed = transform([center[0], center[1]], 'EPSG:4326', toProj);
    this.hsMapService.moveToAndZoom(
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
