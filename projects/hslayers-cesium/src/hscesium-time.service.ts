import {Injectable} from '@angular/core';

import dayjs from 'dayjs';
import {HsEventBusService, getTitle, HsUtilsService} from 'hslayers-ng';
import {Viewer, WebMapServiceImageryProvider} from 'cesium';
import {default as utc} from 'dayjs/plugin/utc';

import {HsCesiumLayersService} from './hscesium-layers.service';
@Injectable({
  providedIn: 'root',
})
export class HsCesiumTimeService {
  apps: {
    [key: string]: {viewer: Viewer};
  } = {default: {viewer: null}};
  constructor(
    public HsCesiumLayersService: HsCesiumLayersService,
    public HsEventBusService: HsEventBusService,
    private hsUtilsService: HsUtilsService
  ) {}

  init(viewer: Viewer, app: string) {
    this.apps[app].viewer = viewer;
    this.monitorTimeLine(app);
  }

  monitorTimeLine(app: string) {
    this.apps[app].viewer.clock.onTick.addEventListener((clock) => {
      const value = clock.currentTime;
      let something_changed = false;
      for (let i = 0; i < this.apps[app].viewer.imageryLayers.length; i++) {
        let round_time = new Date(value.toString());
        round_time.setMilliseconds(0);
        round_time.setMinutes(0);
        round_time.setSeconds(0);

        const layer = this.apps[app].viewer.imageryLayers.get(i);
        if (this.hsUtilsService.instOf(layer.imageryProvider , WebMapServiceImageryProvider)) {
          const prmCache = this.HsCesiumLayersService.findParamCache(
            layer,
            app
          );
          if (prmCache && this.getTimeParameter(layer)) {
            if (prmCache.dimensions.time) {
              let min_dist = Number.MAX_VALUE;
              let min_i = -1;
              for (
                let pt = 0;
                pt < prmCache.dimensions.time.values.length;
                pt++
              ) {
                const diff2 =
                  round_time.getTime() -
                  prmCache.dimensions.time.values[pt].getTime();
                if (diff2 > 0 && diff2 < min_dist) {
                  min_dist = diff2;
                  min_i = pt;
                }
              }
              round_time = prmCache.dimensions.time.values[min_i];
            }
            const diff = Math.abs(
              round_time.getTime() -
                new Date(
                  prmCache.parameters[this.getTimeParameter(layer)]
                ).getTime()
            );
            if (diff > 1000 * 60) {
              //console.log('Was', prmCache.parameters[this.getTimeParameter(layer)], 'New', round_time)
              this.HsCesiumLayersService.changeLayerParam(
                layer,
                this.getTimeParameter(layer),
                round_time.toISOString(),
                app
              );
              something_changed = true;
            }
          }
        }
      }
      this.HsCesiumLayersService.removeLayersWithOldParams(app);
      if (something_changed) {
        this.HsEventBusService.cesiumTimeLayerChanges.next(
          this.getLayerListTimes(app)
        );
      }
    });
  }

  getLayerListTimes(app: string) {
    if (this.apps[app].viewer.isDestroyed()) {
      return;
    }
    const tmp = [];
    for (let i = 0; i < this.apps[app].viewer.imageryLayers.length; i++) {
      const layer = this.apps[app].viewer.imageryLayers.get(i);
      const prmCache = this.HsCesiumLayersService.findParamCache(layer, app);
      if (prmCache) {
        const t = new Date(prmCache.parameters[this.getTimeParameter(layer)]);
        dayjs.extend(utc);
        tmp.push({
          name: getTitle(this.HsCesiumLayersService.findOlLayer(layer, app)),
          time: dayjs.utc(t).format('DD-MM-YYYY HH:mm'),
        });
      }
    }
    return tmp;
  }

  getTimeParameter(cesium_layer) {
    if (cesium_layer.prm_cache) {
      if (cesium_layer.prm_cache.parameters.time) {
        return 'time';
      }
      if (cesium_layer.prm_cache.parameters.TIME) {
        return 'TIME';
      }
    } else {
      return undefined;
    }
  }
}
