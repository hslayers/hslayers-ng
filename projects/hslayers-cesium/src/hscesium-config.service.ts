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

  get(app: string): HsCesiumConfigObject {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsCesiumConfigObject();
    }
    return this.apps[app ?? 'default'];
  }

  update?(newConfig: HsCesiumConfigObject, app?: string): void {
    let appConfig = this.apps[app];
    if (appConfig == undefined) {
      this.apps[app] = new HsCesiumConfigObject();
      appConfig = this.apps[app];
    }
    Object.assign(appConfig, newConfig);

    this.cesiumConfigChanges.next(this.apps[app]);
  }
}
