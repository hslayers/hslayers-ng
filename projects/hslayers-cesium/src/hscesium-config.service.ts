import {Injectable} from '@angular/core';
import {ReplaySubject, Subject} from 'rxjs';

import {GeocoderService, ImageryProvider, JulianDate, Viewer} from 'cesium';
import {HsTerrainLayerDescriptor} from 'hslayers-ng/types';

export class HsCesiumConfigObject {
  cesiumAccessToken?: string;
  cesiumAnimation?: boolean;
  cesiumBase?: string;
  cesiumBaseLayerPicker?: boolean;
  cesiumBingKey?: string;
  cesiumDebugShowFramesPerSecond?: boolean;
  cesiumFullscreenButton?: boolean;
  cesiumGeocoder?: boolean | Array<GeocoderService>;
  cesiumInfoBox?: boolean;
  cesiumShadows?: number;
  cesiumTime?: JulianDate;
  cesiumTimeline?: boolean;
  creditContainer?: Element | string;
  imageryProvider?: ImageryProvider;
  verticalExaggeration?: number;
  terrainLayers?: HsTerrainLayerDescriptor[];
  constructor() {}
}
@Injectable({
  providedIn: 'root',
})
export class HsCesiumConfig extends HsCesiumConfigObject {
  /**
   * Triggered when cesiumConfig is updated using 'update' function of HsCesiumService.
   */
  cesiumConfigChanges?: Subject<HsCesiumConfigObject> = new Subject();
  viewerLoaded: ReplaySubject<Viewer> = new ReplaySubject();

  constructor() {
    super();
  }

  update?(newConfig: HsCesiumConfigObject): void {
    Object.assign(this, newConfig);
    this.cesiumConfigChanges.next(this);
  }
}
