import {Injectable} from '@angular/core';

import {ImageryProvider, JulianDate} from 'cesium';
import {Subject} from 'rxjs';

@Injectable()
export class HsCesiumConfig {
  /**
   * Triggered when cesiumConfig is updated using 'update' function of HsCesiumService.
   */
  cesiumConfigChanges?: Subject<HsCesiumConfig> = new Subject();

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

  update?(newConfig: HsCesiumConfig): void {
    Object.assign(this, newConfig);

    this.cesiumConfigChanges.next(this);
  }
}
