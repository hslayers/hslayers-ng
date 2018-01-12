/**
 * @ngdoc module
 * @module hs.compositions
 * @name hs.compositions
 * @description Composition module
 */

define(['angular', 'ol', 'SparqlJson', 'angularjs-socialshare', 'map', 'ows.nonwms', 'config_parsers'],

    function (angular, ol, SparqlJson, social) {
        return {
            init() {
                angular.module('hs.compositions')
                    /**
                     * @module hs.compositions
                     * @name hs.compositions.service_parser
                     * @ngdoc service
                     * @description Contains function of managing composition (loading, removing Layers)
                     */
                    .service('hs.compositions.service_parser', ['hs.map.service', 'config', 'Core', '$rootScope', 'hs.utils.service', 'hs.ows.nonwms.service', 'hs.compositions.config_parsers.service',
                        function (hsMap, config, Core, $rootScope, utils, nonWmsService, configParsers) {
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
                                load: function (url, overwrite, callback, pre_parse) {
                                    me.current_composition_url = url;
                                    url = url.replace('&amp;', '&');
                                    url = utils.proxify(url);
                                    $.ajax({
                                        url: url
                                    })
                                        .done(function (response) {
                                            if (response.success == true) {
                                                me.composition_loaded = url;
                                                if (typeof pre_parse != 'undefined') response = pre_parse(response);
                                                /**
                                                * @ngdoc event
                                                * @name hs.compositions.service_parser#compositions.composition_loading
                                                * @eventType broadcast on $rootScope
                                                * @description Fires when composition is downloaded from server and parsing begins
                                                */
                                                $rootScope.$broadcast('compositions.composition_loading', response);
                                                if (angular.isUndefined(overwrite) || overwrite == true) {
                                                    me.removeCompositionLayers();
                                                }
                                                me.current_composition = response.data || response;
                                                me.current_composition_title = response.title || response.data.title;
                                                hsMap.map.getView().fit(me.parseExtent(response.extent || response.data.extent), hsMap.map.getSize());
                                                var layers = me.jsonToLayers(response);
                                                for (var i = 0; i < layers.length; i++) {
                                                    hsMap.map.addLayer(layers[i]);
                                                }

                                                if (angular.isObject(response.data.current_base_layer)) {
                                                    hsMap.map.getLayers().forEach(function (lyr) {
                                                        if (lyr.get('title') == response.data.current_base_layer.title)
                                                            lyr.setVisible(true);
                                                    });
                                                }

                                                if (config.open_lm_after_comp_loaded) {
                                                    Core.setMainPanel('layermanager');
                                                }

                                                me.composition_edited = false;
                                                /**
                                                * @ngdoc event
                                                * @name hs.compositions.service_parser#compositions.composition_loaded
                                                * @eventType broadcast on $rootScope
                                                * @description Fires when composition is loaded or not loaded with Error message
                                                */
                                                $rootScope.$broadcast('compositions.composition_loaded', response);
                                                if (typeof callback !== 'undefined' && callback !== null) callback();
                                            } else {
                                                var respError = {};
                                                respError.error = response.error;
                                                switch (response.error) {
                                                    case "no data":
                                                        respError.title = "Composition not found";
                                                        respError.abstract = "Sorry but composition was deleted or incorrectly saved"
                                                        break;
                                                }
                                                $rootScope.$broadcast('compositions.composition_loaded', respError);
                                            }
                                        })
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
                                loadInfo: function (url) {
                                    var info = {};
                                    url = url.replace('&amp;', '&');
                                    url = utils.proxify(url);
                                    $.ajax({
                                        url: url,
                                        async: false
                                    })
                                        .done(function (response) {
                                            info = response.data || response;
                                            /**
                                            * @ngdoc event
                                            * @name hs.compositions.service_parser#compositions.composition_info_loaded
                                            * @eventType broadcast on $rootScope
                                            * @description Fires when metadata about selected composition are loaded
                                            */
                                            $rootScope.$broadcast('compositions.composition_info_loaded', response);
                                        });
                                    return info;
                                },

                                parseExtent: function (b) {
                                    if (typeof b == 'string')
                                        b = b.split(" ");
                                    var first_pair = [parseFloat(b[0]), parseFloat(b[1])]
                                    var second_pair = [parseFloat(b[2]), parseFloat(b[3])];
                                    first_pair = ol.proj.transform(first_pair, 'EPSG:4326', hsMap.map.getView().getProjection());
                                    second_pair = ol.proj.transform(second_pair, 'EPSG:4326', hsMap.map.getView().getProjection());
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
                                }
                            };

                            /**
                            * @ngdoc method
                            * @name hs.compositions.service_parser#jsonToLayer 
                            * @public
                            * @param {Object} lyr_def Layer to be created (encapsulated in layer definition object)
                            * @returns {Function} Parser function to create layer (using config_parsers service)
                            * @description Select correct layer parser for input data based on layer "className" property (HSLayers.Layer.WMS/OpenLayers.Layer.Vector)
                            */
                            me.jsonToLayer = function (lyr_def) {
                                switch (lyr_def.className) {
                                    case "HSLayers.Layer.WMS":
                                        return configParsers.createWmsLayer(lyr_def);
                                        break;
                                    case 'OpenLayers.Layer.Vector':
                                        return configParsers.createVectorLayer(lyr_def);
                                        break;
                                }
                            }
                            return me;
                        }
                    ])
            }
        }

    })