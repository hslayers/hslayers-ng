import Viewer from 'cesium/Source/Widgets/Viewer/Viewer';
import WebMapServiceImageryProvider from 'cesium/Source/Scene/WebMapServiceImageryProvider';
import knockout from 'cesium/Source/ThirdParty/knockout';
import moment from 'moment';
import {HsCesiumLayersService} from './hscesium-layers.service';
import {HsEventBusService, getTitle} from 'hslayers-ng';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsCesiumTimeService {
  viewer: Viewer;
  constructor(
    public HsCesiumLayersService: HsCesiumLayersService,
    public HsEventBusService: HsEventBusService
  ) {}

  init(viewer: Viewer) {
    this.viewer = viewer;
    this.monitorTimeLine();
  }

  monitorTimeLine() {
    knockout
      .getObservable(this.viewer.clockViewModel, 'currentTime')
      .subscribe((value) => {
        let something_changed = false;
        for (let i = 0; i < this.viewer.imageryLayers.length; i++) {
          let round_time = new Date(value.toString());
          round_time.setMilliseconds(0);
          round_time.setMinutes(0);
          round_time.setSeconds(0);

          const layer = this.viewer.imageryLayers.get(i);
          if (layer.imageryProvider instanceof WebMapServiceImageryProvider) {
            const prmCache = this.HsCesiumLayersService.findParamCache(layer);
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
                  round_time.toISOString()
                );
                something_changed = true;
              }
            }
          }
        }
        this.HsCesiumLayersService.removeLayersWithOldParams();
        if (something_changed) {
          this.HsEventBusService.cesiumTimeLayerChanges.next(
            this.getLayerListTimes()
          );
        }
      });
  }

  getLayerListTimes() {
    if (this.viewer.isDestroyed()) {
      return;
    }
    const tmp = [];
    for (let i = 0; i < this.viewer.imageryLayers.length; i++) {
      const layer = this.viewer.imageryLayers.get(i);
      const prmCache = this.HsCesiumLayersService.findParamCache(layer);
      if (prmCache) {
        const t = new Date(prmCache.parameters[this.getTimeParameter(layer)]);
        tmp.push({
          name: getTitle(this.HsCesiumLayersService.findOlLayer(layer)),
          time: moment.utc(t).format('DD-MM-YYYY HH:mm'),
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
