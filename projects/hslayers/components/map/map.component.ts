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

import {HS_PRMS} from 'hslayers-ng/components/share';
import {HsConfig} from 'hslayers-ng/config';
import {HsCoreService} from 'hslayers-ng/shared/core';
import {HsEventBusService} from 'hslayers-ng/shared/event-bus';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsShareUrlService} from 'hslayers-ng/components/share';

@Component({
  selector: 'hs-map',
  templateUrl: './map.component.html',
})
export class HsMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('map') map: ElementRef;

  unregisterMapSyncCenterHandlerSubscription: Subscription;
  constructor(
    public HsMapService: HsMapService,
    public HsShareUrlService: HsShareUrlService,
    public HsCoreService: HsCoreService,
    public HsConfig: HsConfig,
    public HsEventBusService: HsEventBusService,
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
    const pos = this.HsShareUrlService.getParamValues([
      HS_PRMS.x,
      HS_PRMS.y,
      HS_PRMS.zoom,
    ]);
    if (!Object.keys(pos).some((k) => pos[k] == undefined || pos[k] == 'NaN')) {
      this.HsMapService.moveToAndZoom(
        parseFloat(pos[HS_PRMS.x]),
        parseFloat(pos[HS_PRMS.y]),
        parseInt(pos[HS_PRMS.zoom]),
      );
    }
    if (
      this.HsShareUrlService.getParamValue(HS_PRMS.pureMap) ||
      this.HsConfig.pureMap == true
    ) {
      this.HsCoreService.setPuremapApp(true);
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
