define(['angular', 'ol', 'map'],

    function(angular, ol) {
        var module = angular.module('hs.status_creator', ['hs.map', 'hs.core'])
            .directive('statusCreator', function() {
                return {
                    templateUrl: hsl_path + 'components/status_creator/partials/dialog.html'
                };
            })
                        
            .service('status_creator', ['OlMap', 'Core', function(OlMap, Core) {
                var me = {
                    map2json: function(map, saveAll) {
                        var json = {};

                        if (map.metadata) {
                            json = map.metadata.get();
                        }

                        if (map.user) {
                            json.user = map.user.get();
                        }

                        // Map properties
                        json.scale = map.getScale();
                        json.projection = map.projection.getCode().toLowerCase();
                        var center = map.getCenter();
                        if (center) {
                            json.center = [center.lon, center.lat];
                        }
                        json.units = map.units;

                        if (map.maxExtent) {
                            json.maxExtent = {};
                            json.maxExtent.left = map.maxExtent.left;
                            json.maxExtent.bottom = map.maxExtent.bottom;
                            json.maxExtent.right = map.maxExtent.right;
                            json.maxExtent.top = map.maxExtent.top;
                        }

                        json.minResolution = map.minResolution;
                        json.maxResolution = map.maxResolution;
                        json.numZoomLevels = map.numZoomLevels;

                        json.resolutions = map.resolutions;
                        json.scales = map.scales;
                        json.sphericalMercator = map.sphericalMercator;


                        // Layers properties
                        json.layers = me.layers2json(map.layers, saveAll);

                        return json;
                    },

                    /**
                     * Converts map layers into a JSON object.
                     * Uses layer2json().
                     *
                     * @param {Array} layers Map layers that should be converted
                     * @param {Boolean} saveAll Whether all the layer attributes should be saved
                     * @returns {Array} JSON object representing the layers
                     */
                    layers2json: function(layers, saveAll) {

                        var i, ilen;
                        var json = [];

                        for (i = 0, ilen = layers.length; i < ilen; ++i) {
                            var l = me.layer2json(layers[i], saveAll);
                            if (l) {
                                json.push(l);
                            }
                        }

                        return json;
                    },

                    /**
                     * Converts map layer from Layer object to text in JSON notation.
                     *
                     * Syntactic sugar for layer2json() & OpenLayers.Format.JSON.write()
                     *
                     * @param {Object} layer Layer to be converted
                     * @param {Boolean} Whether to use pretty notation
                     * @param {Boolean} saveAll Whether all the layer attributes should be saved
                     * @returns {String} Text in JSON notation representing the layer
                     */
                    layer2string: function(layer, pretty, saveAll) {
                        var json = me.layer2json(layer, saveAll);
                        var text = me.JSON.write(json, pretty);
                        return text;
                    },

                    /**
                     * Converts map layer into a JSON object.
                     *
                     * Layer properties covered:  CLASS_NAME, name, url, params,
                     *                            group, displayInLayerSwitcher, visibility,
                     *                            attribution, transitionEffect,
                     *                             isBaseLayer, minResolution,
                     *                            maxResolution, minScale, maxScale, metadata,
                     *                            abstract, opacity, singleTile, removable,
                     *                            queryable, legend, projections,
                     *                            wmsMinScale, wmsMaxScale
                     *
                     * The layer index is not covered, as we assume
                     * that it is corresponding to the layers order.
                     *
                     * @param {Object} layer Map layer that should be converted
                     * @param {Boolean} saveAll Whether all the layer attributes should be saved. Sometimes we want to save network traffic and save completely only the foreign layers, in such a case set saveAll to false.
                     * @returns {Object} JSON object representing the layer
                     */
                    layer2json: function(layer, saveAll) {
                        var json = {};

                        if (!layer instanceof OpenLayers.Layer) {
                            return;
                        }

                        if (layer.name.search("OpenLayers.Handler") === 0) {
                            return;
                        }

                        if (layer.name.search("HSLayers.Control") === 0 || layer.name.search("OpenLayers.Control") === 0) {
                            return;
                        }

                        // Check if the layer is foreigner 
                        if (layer.saveState) {
                            saveAll = true; // If so, make sure we save all the attributes
                        }

                        // Common stuff 

                        // type
                        json.className = layer.CLASS_NAME;
                        json.origClassName = layer.CLASS_NAME; // the original type

                        // name
                        json.name = layer.name;

                        // options
                        json.visibility = layer.visibility;
                        json.opacity = layer.opacity;
                        json.title = layer.title;
                        json.index = layer.map.getLayerIndex(layer);
                        json.path = layer.path;

                        if (saveAll) {
                            json.group = layer.group;
                            json.displayInLayerSwitcher = layer.displayInLayerSwitcher;
                            json.attribution = layer.attribution;
                            json.alwaysInRange = layer.alwaysInRange;
                            json.transitionEffect = layer.transitionEffect;
                            json.isBaseLayer = layer.isBaseLayer;
                            json.alwaywInRange = layer.alwaysInRange;
                            json.minResolution = layer.minResolution;
                            json.maxResolution = layer.maxResolution;
                            json.minScale = layer.minScale;
                            json.maxScale = layer.maxScale;
                            json.metadataURL = layer.metadataURL;
                            json.capabilitiesURL = layer.capabilitiesURL;
                            json.metadata = layer.metadata;
                            json.abstract = layer.abstract;
                            json.removable = layer.removable;
                            json.dimensions = layer.dimensions;
                            json.projection = layer.projection.getCode();
                            json.projections = [];
                            if (layer.projections) {
                                json
                                for (var j = 0; j < layer.projections.length; ++j) {
                                    json.projections[j] = layer.projections[j].getCode().toLowerCase();
                                }
                            }
                            if (layer.maxExtent) {
                                json.maxExtent = {};
                                json.maxExtent.left = layer.maxExtent.left;
                                json.maxExtent.bottom = layer.maxExtent.bottom;
                                json.maxExtent.right = layer.maxExtent.right;
                                json.maxExtent.top = layer.maxExtent.top;
                            }

                            // HTTPRequest
                            if (layer instanceof OpenLayers.Layer.HTTPRequest) {

                                json.className = "OpenLayers.Layer.HTTPRequest";
                                json.url = layer.url;
                                json.params = layer.params;

                                // Grid
                                if (layer instanceof OpenLayers.Layer.Grid) {

                                    json.className = "OpenLayers.Layer.Grid";
                                    json.singleTile = layer.singleTile;
                                    json.ratio = layer.ratio;
                                    json.buffer = layer.buffer;
                                    if (layer.tileSize) {
                                        json.tileSize = [layer.tileSize.w, layer.tileSize.h];
                                    }

                                    // XYZ, OSM
                                    if (layer instanceof(OpenLayers.Layer.XYZ)) {
                                        json.className = "OpenLayers.Layer.XYZ";
                                        json.wrapDateLine = layer.wrapDateLine;
                                        json.sphericalMercator = layer.sphericalMercator;
                                    }

                                    // WMS 
                                    if (layer instanceof OpenLayers.Layer.WMS) {

                                        json.className = "OpenLayers.Layer.WMS";
                                        json.legend = layer.legend;
                                        json.wmsMinScale = layer.wmsMinScale;
                                        json.wmsMaxScale = layer.wmsMaxScale;

                                        if (layer instanceof HSLayers.Layer.WMS) {
                                            json.className = "HSLayers.Layer.WMS";
                                        }

                                        if (layer instanceof HSLayers.Layer.WFS) {
                                            json.className = "HSLayers.Layer.WFS";
                                        }

                                        if (layer instanceof HSLayers.Layer.WCS) {
                                            json.className = "HSLayers.Layer.WCS";
                                        }
                                    }

                                    // MapServer 
                                    if (layer instanceof OpenLayers.Layer.MapServer) {
                                        json.className = "OpenLayers.Layer.MapServer";
                                        json.queryable = layer.queryable;


                                        if (layer instanceof HSLayers.Layer.TreeLayer) {
                                            json.className = "HSLayers.Layer.TreeLayer";
                                            json.params = layer.params;
                                            json.params.LAYERS = layer._getVisibleLayerNames();
                                        }
                                    }
                                }
                            }

                            // Vector 
                            if (layer instanceof OpenLayers.Layer.Vector) {
                                /* RB. Will be implemented later
                                *this._saveVectorLayer(json, layer);
                                */
                            }

                            // image
                            if (layer instanceof OpenLayers.Layer.Image) {
                                /* RB. Will be implemented later
                                * this._saveImageLayer(json, layer);
                                */
                            }
                        } else {
                            if (json.className == "OpenLayers.Layer.Vector" &&
                                !json.protocol && layer.features) {

                                var format = new OpenLayers.Format.GeoJSON();
                                var features = format.write(layer.features);
                                json.features = (new OpenLayers.Format.JSON()).read(features);
                            }
                        }

                        return json;
                    }
                };
                return me;
            }])
            
            .controller('StatusCreator', ['$scope', '$rootScope', 'OlMap', 'Core', 'status_creator',
                function($scope, $rootScope, OlMap, Core, status_creator) {
                    $scope.$emit('scope_loaded', "StatusCreator");
                    
                    $scope.getCurrentExtent = function(){
                        var b = OlMap.map.getView().calculateExtent(OlMap.map.getSize()); 
                        var pair1 = [b[0], b[1]]
                        var pair2 = [b[2], b[3]];
                        var cur_proj = OlMap.map.getView().getProjection().getCode();
                        pair1 = ol.proj.transform(pair1, cur_proj, 'EPSG:4326');
                        pair2 = ol.proj.transform(pair2, cur_proj, 'EPSG:4326');
                        $scope.bbox = [pair1[0].toFixed(8), pair1[1].toFixed(8), pair2[0].toFixed(8), pair2[1].toFixed(8)];
                    }
                    
                    $scope.download = function(){
                        if(console) console.log(status_creator.map2json(OlMap.map, false));
                    }
                    
                    $scope.getCurrentExtent();
                }
            ]);

    })
