import {Injectable} from '@angular/core';

import {ImageryProvider, JulianDate, Viewer} from 'cesium';
import {ReplaySubject, Subject} from 'rxjs';
export class HsCesiumConfigObject {
  cesiumDebugShowFramesPerSecond?: boolean;
  cesiumShadows?: number;
  cesiumBase?: string;
  createWorldTerrainOptions?;
  terrain_provider?;
  cesiumTimeline?: boolean;
  cesiumAnimation?: boolean;
  creditContainer?: Element | string;
  cesiumInfoBox?: boolean;
  imageryProvider?: ImageryProvider;
  terrainExaggeration?: number;
  cesiumBingKey?: string;
  newTerrainProviderOptions?;
  terrain_providers?: any[];
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
