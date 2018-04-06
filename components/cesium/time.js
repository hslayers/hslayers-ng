define(['ol', 'cesiumjs', 'moment'],

    function (ol, Cesium, moment) {
        var $rootScope;
        var me = {
            monitorTimeLine() {
                Cesium.knockout.getObservable(me.viewer.clockViewModel, 'currentTime').subscribe(function (value) {
                    var to_be_deleted = [];
                    var something_changed = false;
                    for (var i = 0; i < me.viewer.imageryLayers.length; i++) {

                        var round_time = new Date(value.toString());
                        round_time.setMilliseconds(0);
                        round_time.setMinutes(0);
                        round_time.setSeconds(0);

                        var layer = me.viewer.imageryLayers.get(i);
                        if (layer.imageryProvider instanceof Cesium.WebMapServiceImageryProvider) {
                            if (layer.prm_cache && me.getTimeParameter(layer)) {
                                if (layer.prm_cache.possible_times) {
                                    var min_dist = Number.MAX_VALUE;
                                    var min_i = -1;
                                    for (var pt = 0; pt < layer.prm_cache.possible_times.length; pt++) {
                                        var diff2 = round_time - layer.prm_cache.possible_times[pt];
                                        if (diff2 > 0 && diff2 < min_dist) {
                                            min_dist = diff2;
                                            min_i = pt;
                                        }
                                    }
                                    round_time = layer.prm_cache.possible_times[min_i];
                                }
                                var diff = Math.abs(round_time - new Date(layer.prm_cache.parameters[me.getTimeParameter(layer)]));
                                if (diff > 1000 * 60) {
                                    //console.log('Was', layer.prm_cache.parameters[me.getTimeParameter(layer)], 'New', round_time)
                                    layer.prm_cache.parameters[me.getTimeParameter(layer)] = round_time.toISOString();
                                    to_be_deleted.push(layer);
                                    var tmp = new Cesium.ImageryLayer(new Cesium.WebMapServiceImageryProvider(layer.prm_cache), {
                                        alpha: layer.alpha,
                                        show: layer.show
                                    });
                                    tmp.prm_cache = layer.prm_cache;
                                    me.hs_cesium.linkOlLayerToCesiumLayer(layer.ol_layer, tmp);
                                    me.viewer.imageryLayers.add(tmp);
                                    something_changed = true;
                                }
                            }
                        }
                    }
                    while (to_be_deleted.length > 0)
                        me.viewer.imageryLayers.remove(to_be_deleted.pop());
                    if (something_changed) {
                        broadcastLayerList();
                    }
                });
            },

            broadcastLayerList(){
                $rootScope.$broadcast('cesium.time_layers_changed', me.getLayerListTimes());
            },

            getLayerListTimes() {
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

            init: function (viewer, hs_map, hs_cesium, _$rootScope) {
                me.viewer = viewer;
                me.hs_map = hs_map;
                me.hs_cesium = hs_cesium;
                me.monitorTimeLine();
                $rootScope = _$rootScope;
            }

        };
        return me
    }
)