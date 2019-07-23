import { Style, Icon, Stroke, Fill, Circle } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import Observable from 'ol/Observable';

export default ['$rootScope', 'hs.map.service', 'hs.layermanager.service', 'Core', 'hs.utils.service', 'config', function ($rootScope, OlMap, LayMan, Core, utils, config) {
    var me = {
        applyFilters: function (layer) {
            if (!layer) {
                if (LayMan.currentLayer === undefined) return;
                layer = LayMan.currentLayer;
            }

            var source = layer.layer.getSource();

            if (!('hsFilters' in layer)) return source.getFeatures();
            if (!layer.hsFilters) return source.getFeatures();

            var filters = layer.hsFilters;
            var filteredFeatures = [];

            console.log(source.getFeatures());

            source.forEachFeature(function (feature) {
                feature.setStyle(null);
            });

            for (var i in filters) {
                var filter = filters[i];
                var displayFeature;

                switch (filter.type.type) {
                    case 'fieldset':
                        if (filter.selected.length === 0) {
                            displayFeature = function (feature, filter) {
                                return true;
                            };
                            break;
                        }
                        displayFeature = function (feature, filter) {
                            return filter.selected.indexOf(feature.values_[filter.valueField]) !== -1;
                        };
                        break;
                    case 'slider':
                        switch (filter.type.parameters) {
                            case 'lt':
                                displayFeature = function (feature, filter) {
                                    return feature.values_[filter.valueField] < filter.value;
                                };
                                break;
                            case 'le':
                                displayFeature = function (feature, filter) {
                                    return feature.values_[filter.valueField] <= filter.value;
                                };
                                break;
                            case 'gt':
                                displayFeature = function (feature, filter) {
                                    return feature.values_[filter.valueField] > filter.value;
                                };
                                break;
                            case 'ge':
                                displayFeature = function (feature, filter) {
                                    return feature.values_[filter.valueField] >= filter.value;
                                };
                                break;
                            case 'eq':
                                displayFeature = function (feature, filter) {
                                    return feature.values_[filter.valueField] === filter.value;
                                };
                                break;
                        }
                    default:
                        displayFeature = function (feature, filter) {
                            return true;
                        };
                }

                source.forEachFeature(function (feature) {
                    if (!displayFeature(feature, filter)) {
                        feature.setStyle(new Style({}));
                    } else {
                        filteredFeatures.push(feature);
                    }
                });
            }

            layer.filteredFeatures = filteredFeatures;
            return filteredFeatures;
        },

        prepLayerFilter: function (layer) {
            if ('hsFilters' in layer) {
                for (var i in layer.hsFilters) {
                    var filter = layer.hsFilters[i];

                    if (filter.gatherValues) {
                        switch (filter.type.type) {
                            case 'fieldset': case 'dictionary':
                                var source = layer.layer.getSource();
                                source.forEachFeature(function (feature) {
                                    if (filter.values.indexOf(feature.values_[filter.valueField]) === -1) {
                                        filter.values.push(feature.values_[filter.valueField]);
                                    }
                                });
                                break;
                            case 'dateExtent':
                                // // TODO: create time range from date extents of the features, convert datetime fields to datetime datatype
                                // if (filter.range === undefined) filter.range = [];

                                // var source = layer.layer.getSource();
                                // source.forEachFeature(function (feature) {
                                //     if (feature.values_[filter.valueField] < filter.range[0] || filter.range[0] === undefined) {
                                //         filter.range[0] = feature.values_[filter.valueField];
                                //     }
                                //     if (feature.values_[filter.valueField] > filter.range[1] || filter.range[1] === undefined) {
                                //         filter.range[1] = feature.values_[filter.valueField];
                                //     }
                                // });
                                break;
                        }
                    }

                    if (filter.type.type === "fieldset" && filter.selected === undefined && filter.values.length > 0) {
                        filter.selected = filter.values.slice(0);
                    }
                }
            }
        }
    };

    $rootScope.$on('layermanager.layer_added', function (e, layer) {
        me.prepLayerFilter(layer);

        if (utils.instOf(layer.layer, VectorLayer)) {
            var source = layer.layer.getSource();
            console.log(source.getState());
            var listenerKey = source.on('change', function (e) {
                if (source.getState() === 'ready') {
                    console.log(source.getState());
                    Observable.unByKey(listenerKey);
                    me.prepLayerFilter(layer);
                    me.applyFilters(layer);
                }
            });
        }
    });

    return me;
}]