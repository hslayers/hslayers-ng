import {Injectable} from '@angular/core';

import {ImageryProvider, JulianDate} from 'cesium';
import {Subject} from 'rxjs';
export class HsCesiumConfigObject {
  cesiumDebugShowFramesPerSecond?: boolean;
  cesiumShadows?: number;
  cesiumBase?: string;
  createWorldTerrainOptions?: any;
  terrain_provider?: any;
  cesiumTimeline?: boolean;
  cesiumAnimation?: boolean;
  creditContainer?: Element | string;
  cesiumInfoBox?: boolean;
  imageryProvider?: ImageryProvider;
  terrainExaggeration?: number;
  cesiumBingKey?: string;
  newTerrainProviderOptions?: any;
  terrain_providers?: any[];
  cesiumAccessToken?: string;
  cesiumTime?: JulianDate;
  constructor() {}
}
@Injectable()
export class HsCesiumConfig {
  apps: {[id: string]: HsCesiumConfigObject} = {
    default: {},
  };
  /**
   * Triggered when cesiumConfig is updated using 'update' function of HsCesiumService.
   */
  cesiumConfigChanges?: Subject<HsCesiumConfigObject> = new Subject();

  constructor() {}

  get(): HsCesiumConfigObject {
    if (this == undefined) {
      this = new HsCesiumConfigObject();
    }
    return this;
  }

  update?(newConfig: HsCesiumConfigObject): void {
    let appConfig = this;
    if (appConfig == undefined) {
      this = new HsCesiumConfigObject();
      appConfig = this;
    }
    Object.assign(appConfig, newConfig);

    this.cesiumConfigChanges.next(this);
  }
}
