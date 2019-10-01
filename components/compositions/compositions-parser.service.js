import { transform } from 'ol/proj';
import 'hs.source.SparqlJson'
import 'angular-socialshare';

export default ['hs.map.service', 'config', 'Core', '$rootScope', '$http', 'hs.utils.service', 'hs.compositions.layerParserService', 'hs.layout.service',
    function (hsMap, config, Core, $rootScope, $http, utils, layerParserService, layoutService) {
        var me = {
            /**
            * @ngdoc property
            * @name hs.compositions.service_parser#composition_loaded
            * @public
            * @type {string} null
            * @description Stores current composition URL if there is one or NULL
            */
            composition_loaded: null,
            /**
            * @ngdoc property
            * @name hs.compositions.service_parser#composition_edited
            * @public
            * @type {Boolean} null
            * @description Stores whether current composition was edited (for composition changes, saving etc.)
            */
            composition_edited: false,
            utils: utils,
            /**
            * @ngdoc property
            * @name hs.compositions.service_parser#current_composition_title
            * @public
            * @type {String} ""
            * @description Stores title of current composition
            */
            current_composition_title: "",
            /**
            * @ngdoc method
            * @name hs.compositions.service_parser#load 
            * @public
            * @param {String} url Url of selected composition
            * @param {Boolean} overwrite Whether overwrite current composition in map - remove all layers from maps which originate from composition (if not pasted, it counts as "true")
            * @param {Function} callback Optional function which should be called when composition is successfully loaded
            * @param {Function} pre_parse Optional function for pre-parsing loaded data about composition to accepted format
            * @description Load selected composition from server, parse it and add layers to map. Optionally (based on app config) may open layer manager panel
            */
            loadUrl: function (url, overwrite, callback, pre_parse) {
                return new Promise((resolve, reject) => {
                    me.current_composition_url = url;
                    url = url.replace('&amp;', '&');
                    url = utils.proxify(url);
                    $http({ url: url, overwrite, callback, pre_parse }).
                        then(me.loaded,
                            function (err) {

                            }).then(() => {
                                resolve();
                            });
                })
            },

            loaded(response) {
                /**
                 * @ngdoc event
                 * @name hs.compositions.service_parser#compositions.composition_loading
                 * @eventType broadcast on $rootScope
                 * @description Fires when composition is downloaded from server and parsing begins
                 */
                $rootScope.$broadcast('compositions.composition_loading', response.data);
                if (me.checkLoadSuccess(response)) {
                    me.composition_loaded = response.config.url;
                    if (angular.isDefined(response.config.pre_parse))
                        response = response.config.pre_parse(response.data);
                    /*
                    Response might contain {data:{abstract:...}} or {abstract:} 
                    directly. If there is data object, 
                    that means composition is enclosed in 
                    container which itself might contain title or extent 
                    properties */
                    me.loadCompositionObject(response.data.data || response.data,
                        response.config.overwrite, response.title, response.extent);
                    me.finalizeCompositionLoading(response.data);
                    if (angular.isFunction(response.config.callback))
                        response.config.callback();
                } else {
                    me.raiseCompositionLoadError(response.data);
                }
            },

            checkLoadSuccess(response) {
                return response.data.success == true || /*micka*/
                    (angular.isUndefined(response.data.success) && /*layman*/
                        angular.isDefined(response.data.name)
                    )
            },

            loadCompositionObject: function (obj, overwrite, titleFromContainer, extentFromContainer) {
                if (angular.isUndefined(overwrite) || overwrite == true) {
                    me.removeCompositionLayers();
                }
                me.current_composition = obj;
                me.current_composition_title = titleFromContainer || obj.title;
                hsMap.map.getView().fit(me.parseExtent(extentFromContainer || obj.extent), hsMap.map.getSize());
                var layers = me.jsonToLayers(obj);
                for (var i = 0; i < layers.length; i++) {
                    hsMap.addLayer(layers[i]);
                }

                if (angular.isObject(obj.current_base_layer)) {
                    hsMap.map.getLayers().forEach(function (lyr) {
                        if (lyr.get('title') == obj.current_base_layer.title)
                            lyr.setVisible(true);
                    });
                }
            },

            finalizeCompositionLoading: function (responseData) {
                if (config.open_lm_after_comp_loaded) {
                    layoutService.setMainPanel('layermanager');
                }

                me.composition_edited = false;
                /**
                * @ngdoc event
                * @name hs.compositions.service_parser#compositions.composition_loaded
                * @eventType broadcast on $rootScope
                * @description Fires when composition is loaded or not loaded with Error message
                */
                $rootScope.$broadcast('compositions.composition_loaded', responseData);
            },

            raiseCompositionLoadError: function (response) {
                var respError = {};
                respError.error = response.error;
                switch (response.error) {
                    case "no data":
                        respError.title = "Composition not found";
                        respError.abstract = "Sorry but composition was deleted or incorrectly saved"
                        break;
                }
                $rootScope.$broadcast('compositions.composition_loaded', respError);
            },

            /**
            * @ngdoc method
            * @name hs.compositions.service_parser#removeCompositionLayers 
            * @public
            * @description Remove all layers gained from composition from map 
            */
            removeCompositionLayers: function () {
                var to_be_removed = [];
                hsMap.map.getLayers().forEach(function (lyr) {
                    if (lyr.get('from_composition'))
                        to_be_removed.push(lyr);
                });
                while (to_be_removed.length > 0) {
                    hsMap.map.removeLayer(to_be_removed.shift());
                }
            },
            /**
            * @ngdoc method
            * @name hs.compositions.service_parser#loadInfo 
            * @public
            * @param {String} url Url to composition info
            * @returns {Object} Object containing composition info
            * @description Send Ajax request to selected server to gain information about composition
            */
            loadInfo: function (url, cb) {
                var info = {};
                url = url.replace('&amp;', '&');
                url = utils.proxify(url);
                $http({ url: url }).
                    then(function (response) {
                        info = response.data.data || response.data;
                        /**
                        * @ngdoc event
                        * @name hs.compositions.service_parser#compositions.composition_info_loaded
                        * @eventType broadcast on $rootScope
                        * @description Fires when metadata about selected composition are loaded
                        */
                        $rootScope.$broadcast('compositions.composition_info_loaded', response.data);
                        cb(info);
                    }, function (err) {

                    });
            },

            parseExtent: function (b) {
                if (typeof b == 'string')
                    b = b.split(" ");
                var first_pair = [parseFloat(b[0]), parseFloat(b[1])]
                var second_pair = [parseFloat(b[2]), parseFloat(b[3])];
                first_pair = transform(first_pair, 'EPSG:4326', hsMap.map.getView().getProjection());
                second_pair = transform(second_pair, 'EPSG:4326', hsMap.map.getView().getProjection());
                return [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
            },

            /**
            * @ngdoc method
            * @name hs.compositions.service_parser#jsonToLayers 
            * @public
            * @param {Object} composition Composition object with Layers
            * @returns {Array} Array of created layers
            * @description Parse composition object to extract individual layers and add them to map
            */
            jsonToLayers: function (j) {
                var layers = [];
                if (j.data) j = j.data;
                for (var i = 0; i < j.layers.length; i++) {
                    var lyr_def = j.layers[i];
                    layers.push(me.jsonToLayer(lyr_def));
                }
                return layers;
            },

            /**
            * @ngdoc method
            * @name hs.compositions.service_parser#jsonToLayer 
            * @public
            * @param {Object} lyr_def Layer to be created (encapsulated in layer definition object)
            * @returns {Function} Parser function to create layer (using config_parsers service)
            * @description Select correct layer parser for input data based on layer "className" property (HSLayers.Layer.WMS/OpenLayers.Layer.Vector)
            */
            jsonToLayer: function (lyr_def) {
                switch (lyr_def.className) {
                    case "HSLayers.Layer.WMS":
                        return layerParserService.createWmsLayer(lyr_def);
                        break;
                    case 'OpenLayers.Layer.Vector':
                        return layerParserService.createVectorLayer(lyr_def);
                        break;
                }
            }
        };

        return me;
    }
]