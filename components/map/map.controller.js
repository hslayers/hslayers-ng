import mapDirective from './map.directive';
import { transform } from 'ol/proj';

export default ['$scope', 'hs.map.service', 'config', 'hs.permalink.urlService', 'Core', '$rootScope',
    function ($scope, OlMap, config, permalink, Core, $rootScope) {

        var map = OlMap.map;

        /**
         * @ngdoc method
         * @name hs.map.controller#setTargetDiv
         * @public
         * @description Sets div element of the map
         * @param {string} div_id ID pf the container element
         * @returns {ol.Map} 
         */
        $scope.setTargetDiv = function (div_id) {
            OlMap.map.setTarget(div_id);
        }

        /**
         * @ngdoc method
         * @name hs.map.controller#findLayerByTitle
         * @public
         * @param {string} title Title of the layer (from layer creation)
         * @returns {Ol.layer} Ol.layer object
         * @description Find layer object by title of layer 
         */
        $scope.findLayerByTitle = OlMap.findLayerByTitle;

        $scope.hs_map = OlMap;

        //
        $scope.showFeaturesWithAttrHideRest = function (source, attribute, value, attr_to_change, invisible_value, visible_value) {

        }

        /**
         * @ngdoc method
         * @name hs.map.controller#init
         * @public
         * @description Initialization of map object, initialize map and map state from permalink.
         */
        $scope.init = function () {
            if (permalink.getParamValue('visible_layers')) {
                OlMap.visible_layers = permalink.getParamValue('visible_layers').split(';');
            }
            OlMap.init();
            let hs_x = permalink.getParamValue('hs_x');
            let hs_y = permalink.getParamValue('hs_y');
            let hs_z = permalink.getParamValue('hs_z');
            if (hs_x && hs_x != 'NaN' && hs_y && hs_y != 'NaN' && hs_z && hs_z != 'NaN') {
                OlMap.moveToAndZoom(parseFloat(hs_x), parseFloat(hs_y), parseInt(hs_z));
            }

            if (permalink.getParamValue("puremap") || config.pureMap == true) {
                Core.puremapApp = true;
                OlMap.puremap();
            }
        }

        /**
         * @ngdoc method
         * @name hs.map.controller#onCenterSync
         * @private
         * @param {array} data Coordinates in lon/lat and resolution
         * @description This gets called from Cesium map, to synchronize center and resolution between Ol and Cesium maps
         */
        function onCenterSync(event, data) {
            if (angular.isUndefined(data) || data == null) return;
            var transformed_cords = transform([data[0], data[1]], 'EPSG:4326', OlMap.map.getView().getProjection());
            OlMap.moveToAndZoom(transformed_cords[0], transformed_cords[1], zoomForResolution(data[2]));
        }

        $rootScope.$on('map.sync_center', onCenterSync);

        /**
         * @ngdoc method
         * @name hs.map.controller#zoomForResolution
         * @private
         * @param {number} resolution Resolution
         * @description Calculates zoom level for a given resolution
         */
        function zoomForResolution(resolution) {
            var zoom = 0;
            resolution = Math.abs(resolution); //Sometimes resolution is under 0. Ratis
            var r = 156543.03390625; // resolution for zoom 0
            while (resolution < r) {
                r /= 2.0;
                zoom++;
                if (resolution > r) {
                    return zoom;
                }
            }
            return zoom; // resolution was greater than 156543.03390625 so return 0
        }

        $scope.init();
        $scope.$emit('scope_loaded', "Map");
    }
]