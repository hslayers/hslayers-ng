import * as Cesium from 'cesium/Source/Cesium';
import moment from 'moment';
export class HsCesiumTimeService {
  constructor(HsMapService, $rootScope, HsCesiumLayersService) {
    'ngInject';
    this.HsMapService = HsMapService;
    this.$rootScope = $rootScope;
    this.HsCesiumLayersService = HsCesiumLayersService;
  }

  init(HsCesiumService) {
    this.HsCesiumService = HsCesiumService;
    this.viewer = HsCesiumService.viewer;
    this.monitorTimeLine();
  }

  monitorTimeLine() {
    Cesium.knockout
      .getObservable(this.viewer.clockViewModel, 'currentTime')
      .subscribe((value) => {
        let something_changed = false;
        for (let i = 0; i < this.viewer.imageryLayers.length; i++) {
          let round_time = new Date(value.toString());
          round_time.setMilliseconds(0);
          round_time.setMinutes(0);
          round_time.setSeconds(0);

          const layer = this.viewer.imageryLayers.get(i);
          if (
            layer.imageryProvider instanceof Cesium.WebMapServiceImageryProvider
          ) {
            if (layer.prm_cache && this.getTimeParameter(layer)) {
              if (angular.isDefined(layer.prm_cache.dimensions.time)) {
                let min_dist = Number.MAX_VALUE;
                let min_i = -1;
                for (
                  let pt = 0;
                  pt < layer.prm_cache.dimensions.time.values.length;
                  pt++
                ) {
                  const diff2 =
                    round_time - layer.prm_cache.dimensions.time.values[pt];
                  if (diff2 > 0 && diff2 < min_dist) {
                    min_dist = diff2;
                    min_i = pt;
                  }
                }
                round_time = layer.prm_cache.dimensions.time.values[min_i];
              }
              const diff = Math.abs(
                round_time -
                  new Date(
                    layer.prm_cache.parameters[this.getTimeParameter(layer)]
                  )
              );
              if (diff > 1000 * 60) {
                //console.log('Was', layer.prm_cache.parameters[this.getTimeParameter(layer)], 'New', round_time)
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
          this.$rootScope.$broadcast(
            'cesium.time_layers_changed',
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
      if (
        angular.isDefined(layer.ol_layer) &&
        angular.isDefined(layer.prm_cache)
      ) {
        const t = new Date(
          layer.prm_cache.parameters[this.getTimeParameter(layer)]
        );
        tmp.push({
          name: layer.ol_layer.get('title'),
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
