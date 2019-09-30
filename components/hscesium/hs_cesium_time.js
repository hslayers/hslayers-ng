define(['ol','moment'],

    function(ol, moment) {
        var $rootScope;
        var me = {
            monitorTimeLine() {
                Cesium.knockout.getObservable(me.viewer.clockViewModel, 'currentTime').subscribe(function(value) {
                    var something_changed = false;
                    for (var i = 0; i < me.viewer.imageryLayers.length; i++) {

                        var round_time = new Date(value.toString());
                        round_time.setMilliseconds(0);
                        round_time.setMinutes(0);
                        round_time.setSeconds(0);

                        var layer = me.viewer.imageryLayers.get(i);
                        if (layer.imageryProvider instanceof Cesium.WebMapServiceImageryProvider) {
                            if (layer.prm_cache && me.getTimeParameter(layer)) {
                                if (angular.isDefined(layer.prm_cache.dimensions.time)) {
                                    var min_dist = Number.MAX_VALUE;
                                    var min_i = -1;
                                    for (var pt = 0; pt < layer.prm_cache.dimensions.time.values.length; pt++) {
                                        var diff2 = round_time - layer.prm_cache.dimensions.time.values[pt];
                                        if (diff2 > 0 && diff2 < min_dist) {
                                            min_dist = diff2;
                                            min_i = pt;
                                        }
                                    }
                                    round_time = layer.prm_cache.dimensions.time.values[min_i];
                                }
                                var diff = Math.abs(round_time - new Date(layer.prm_cache.parameters[me.getTimeParameter(layer)]));
                                if (diff > 1000 * 60) {
                                    //console.log('Was', layer.prm_cache.parameters[me.getTimeParameter(layer)], 'New', round_time)
                                    me.HsCsLayers.changeLayerParam(layer, me.getTimeParameter(layer), round_time.toISOString());
                                    something_changed = true;
                                }
                            }
                        }
                    }
                    me.HsCsLayers.removeLayersWithOldParams();
                    if (something_changed) {
                        me.broadcastLayerList();
                    }
                });
            },

            broadcastLayerList() {
                $rootScope.$broadcast('cesium.time_layers_changed', me.getLayerListTimes());
            },

            getLayerListTimes() {
                if(me.viewer.isDestroyed()) return;
                var tmp = [];
                for (var i = 0; i < me.viewer.imageryLayers.length; i++) {
                    var layer = me.viewer.imageryLayers.get(i);
                    if (angular.isDefined(layer.ol_layer) && angular.isDefined(layer.prm_cache)) {
                        var t = new Date(layer.prm_cache.parameters[me.getTimeParameter(layer)]);
                        tmp.push({
                            name: layer.ol_layer.get('title'),
                            time: moment.utc(t).format('DD-MM-YYYY HH:mm')
                        });
                    }
                }
                return tmp;
            },

            getTimeParameter(cesium_layer) {
                if (cesium_layer.prm_cache) {
                    if (cesium_layer.prm_cache.parameters.time) return 'time';
                    if (cesium_layer.prm_cache.parameters.TIME) return 'TIME';
                } else {
                    return undefined;
                }
            },

            init: function(viewer, hs_map, hs_cesium, _$rootScope, HsCsLayers) {
                me.viewer = viewer;
                me.hs_map = hs_map;
                me.hs_cesium = hs_cesium;
                me.monitorTimeLine();
                $rootScope = _$rootScope;
                me.HsCsLayers = HsCsLayers;
            }

        };
        return me
    }
)
