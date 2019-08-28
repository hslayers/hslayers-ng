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
            Base.clearData('features');
            if (!Base.queryActive) return;
            me.createFeatureAttributeList();
        });

        me.createFeatureAttributeList = () => {
            Base.data.attributes.length = 0;
            var features = me.selector.getFeatures().getArray();
            var featureDescriptions = [];
            angular.forEach(features, function (feature) {
                featureDescriptions = featureDescriptions.concat(
                    getFeatureAttributes(feature)
                );
            });
            Base.setData(featureDescriptions, 'features');
            $rootScope.$broadcast('queryVectorResult');
        }

        function getFeatureLayerName(feature){
            var layer = feature.getLayer(OlMap.map);
            if (angular.isUndefined(layer) || angular.isDefined(layer.get('show_in_manager')) && layer.get('show_in_manager') === false) return '';
            var layerName = layer.get("title") || layer.get("name");
            return layerName
        }

        /**
        * @function getFeatureAttributes
        * @memberOf hs.query.controller
        * @params {Object} feature Selected feature from map
        * (PRIVATE) Handler for querying vector layers of map. Get information about selected feature.
        */
        function getFeatureAttributes(feature) {
            var attributes = [];
            var tmp = [];
            var hstemplate = null;
            feature.getKeys().forEach((key) => {
                if (['gid', 'geometry', 'wkb_geometry'].indexOf(key) > -1) return;
                if (feature.get('hstemplate')) hstemplate = feature.get('hstemplate');
                if (key == "features") {
                    for (var ixSubFeature in feature.get('features')) {
                        var subFeature = feature.get('features')[ixSubFeature];
                        tmp = tmp.concat(getFeatureAttributes(subFeature));
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
            
            var featureDescription = {
                layer: getFeatureLayerName(feature),
                name: "Feature",
                attributes: attributes,
                hstemplate,
                feature
            };
            tmp.push(featureDescription);
            return tmp;            
        }
    }]