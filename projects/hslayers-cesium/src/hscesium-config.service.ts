import {Injectable} from '@angular/core';
import {ReplaySubject, Subject} from 'rxjs';

import {HsTerrainLayerDescriptor} from 'hslayers-ng/types';
import {ImageryProvider, JulianDate, Viewer} from 'cesium';

export class HsCesiumConfigObject {
  cesiumDebugShowFramesPerSecond?: boolean;
  cesiumShadows?: number;
  cesiumBase?: string;
  cesiumTimeline?: boolean;
  cesiumAnimation?: boolean;
  creditContainer?: Element | string;
  cesiumInfoBox?: boolean;
  imageryProvider?: ImageryProvider;
  terrainExaggeration?: number;
  cesiumBingKey?: string;
  terrainLayers?: HsTerrainLayerDescriptor[];
  cesiumAccessToken?: string;
  cesiumTime?: JulianDate;
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
