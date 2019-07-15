import {Select} from 'ol/interaction';
import {click, pointerMove, altKeyOnly} from 'ol/events/condition.js';

export default ['$rootScope', 'hs.query.baseService', '$sce', 'hs.map.service', 'config',
    function ($rootScope, Base, $sce, OlMap, Config) {
        var me = this;

        this.selector = new Select({
            condition: click,
            multi: (angular.isDefined(Config.query) && Config.query.multi) ? Config.query.multi : false
        });
        $rootScope.$broadcast('vectorSelectorCreated', me.selector);

        if (Base.queryActive) OlMap.map.addInteraction(me.selector);

        $rootScope.$on('queryStatusChanged', function () {
            if (Base.queryActive) OlMap.map.addInteraction(me.selector);
            else OlMap.map.removeInteraction(me.selector);
        });

        me.selector.getFeatures().on('add', function (e) {
            $rootScope.$broadcast('vectorQuery.featureSelected', e.element, me.selector);
            //deprecated
            $rootScope.$broadcast('infopanel.feature_selected', e.element, me.selector);
        });

        me.selector.getFeatures().on('remove', function (e) {
            $rootScope.$broadcast('vectorQuery.featureDelected', e.element);
            //deprecated
            $rootScope.$broadcast('infopanel.feature_deselected', e.element);
        });

        $rootScope.$on('queryClicked', function (e) {
            Base.clearData();
            if (!Base.queryActive) return;
            Base.data.attributes.length = 0;
            var features = me.selector.getFeatures().getArray();
            angular.forEach(features, function (feature) {
                getFeatureAttributes(feature);
            });
        });

        /**
        * @function getFeatureAttributes
        * @memberOf hs.query.controller
        * @params {Object} feature Selected feature from map
        * (PRIVATE) Handler for querying vector layers of map. Get information about selected feature.
        */
        function getFeatureAttributes(feature) {
            var attributes = [];
            feature.getKeys().forEach(function (key) {
                if (key == 'gid' || key == 'geometry') return;
                if (key == "features") {
                    for (var sub_feature in feature.get('features')) {
                        var hstemplate = null;
                        if (feature.get('features')[sub_feature].get('hstemplate')) hstemplate = feature.get('features')[sub_feature].get('hstemplate');
                        var group = {
                            name: "Feature",
                            attributes: [],
                            hstemplate: hstemplate
                        };
                        feature.get('features')[sub_feature].getKeys().forEach(function (key) {
                            if (key == 'gid' || key == 'geometry') return;
                            if ((typeof feature.get('features')[sub_feature].get(key)).toLowerCase() == "string") {
                                group.attributes.push({
                                    name: key,
                                    value: $sce.trustAsHtml(feature.get('features')[sub_feature].get(key))
                                });
                            } else {
                                group.attributes.push({
                                    name: key,
                                    value: feature.get('features')[sub_feature].get(key)
                                });
                            }
                        });
                        Base.setData(group, 'groups');
                    }
                } else {
                    var obj;
                    if ((typeof feature.get(key)).toLowerCase() == "string") {
                        obj = {
                            name: key,
                            value: $sce.trustAsHtml(feature.get(key))
                        };
                    } else {
                        obj = {
                            name: key,
                            value: feature.get(key)
                        };
                    }
                    attributes.push(obj);
                }
            });
            var layer = feature.getLayer(OlMap.map);
            if (angular.isUndefined(layer) || angular.isDefined(layer.get('show_in_manager')) && layer.get('show_in_manager') === false) return;
            var layerName = layer.get("title") || layer.get("name");
            var group = {
                layer: layerName,
                name: "Feature",
                attributes: attributes
            };
            Base.setData(group, 'groups');
            $rootScope.$broadcast('queryVectorResult');
        }
    }]