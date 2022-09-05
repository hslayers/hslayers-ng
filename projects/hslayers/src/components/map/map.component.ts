import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';

import {Subscription} from 'rxjs';
import {transform} from 'ol/proj';

import {HS_PRMS} from '../permalink/get-params';
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
  @Input() app = 'default';
  unregisterMapSyncCenterHandlerSubscription: Subscription;
  constructor(
    public HsMapService: HsMapService,
    public HsShareUrlService: HsShareUrlService,
    public HsCoreService: HsCoreService,
    public HsConfig: HsConfig,
    public HsEventBusService: HsEventBusService,
    private zone: NgZone
  ) {
    this.unregisterMapSyncCenterHandlerSubscription =
      this.HsEventBusService.mapCenterSynchronizations.subscribe((data) => {
        this.onCenterSync(data);
      });
  }
  ngAfterViewInit(): void {
    const visibleLayersParam = this.HsShareUrlService.getParamValue(
      HS_PRMS.visibleLayers
    );
    if (visibleLayersParam) {
      this.HsMapService.visibleLayersInUrl = visibleLayersParam.split(';');
    }
    this.zone.runOutsideAngular(() =>
      this.HsMapService.init(this.map.nativeElement, this.app)
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
        this.app
      );
    }
    if (
      this.HsShareUrlService.getParamValue(HS_PRMS.pureMap) ||
      this.HsConfig.get(this.app).pureMap == true
    ) {
      this.HsCoreService.setPuremapApp(true, this.app);
    }
    this.HsMapService.getMap(this.app).updateSize();
  }

  ngOnDestroy(): void {
    this.unregisterMapSyncCenterHandlerSubscription.unsubscribe();
  }
  /**
   * @param data Coordinates in lon/lat and resolution
   * This gets called from Cesium map, to
   * synchronize center and resolution between Ol and Cesium maps
   */
  onCenterSync(data?) {
    if (this.app == data.app) {
      const center = data.center;
      if (!center) {
        return;
      }
      const toProj = this.HsMapService.getCurrentProj(data.app);
      const transformed = transform(
        [center[0], center[1]],
        'EPSG:4326',
        toProj
      );
      this.HsMapService.moveToAndZoom(
        transformed[0],
        transformed[1],
        this.zoomForResolution(center[2]),
        this.app
      );
    }
  }

  /**
   * @param resolution Resolution
   * Calculates zoom level for a given resolution
   * @returns Zoom level for resolution. If resolution
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
