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
                map2json: function(map, $scope, saveAll) {
                    var json = {
                        abstract: $scope.abstract,
                        title: $scope.title,
                        keywords: $scope.keywords,
                        extent: [$scope.extent1, $scope.extent2, $scope.extent3, $scope.extent4],
                        user: {
                            address: $scope.address,
                            city: $scope.city,
                            country: $scope.country,
                            email: $scope.email,
                            name: $scope.name,
                            organization: $scope.organization,
                            phone: $scope.phone,
                            position: $scope.position,
                            postalcode: $scope.postalcode,
                            state: $scope.state,
                            url: $scope.url
                        }
                    };

                    // Map properties
                    json.scale = map.getView().getProjection().getMetersPerUnit();
                    json.projection = map.getView().getProjection().getCode().toLowerCase();
                    var center = map.getView().getCenter();
                    if (center) {
                        json.center = [center[0], center[1]];
                    }
                    json.units = map.getView().getProjection().getUnits();

                    if (map.maxExtent) {
                        json.maxExtent = {};
                        json.maxExtent.left = map.maxExtent.left;
                        json.maxExtent.bottom = map.maxExtent.bottom;
                        json.maxExtent.right = map.maxExtent.right;
                        json.maxExtent.top = map.maxExtent.top;
                    }

                    //json.minResolution = map.minResolution;
                    //json.maxResolution = map.maxResolution;
                    //json.numZoomLevels = map.numZoomLevels;

                    //json.resolutions = map.resolutions;
                    //json.scales = map.scales;
                    //json.sphericalMercator = map.sphericalMercator;


                    // Layers properties
                    json.layers = me.layers2json(map.getLayers(), saveAll);

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
                    layers.forEach(function(lyr) {
                        var l = me.layer2json(lyr, saveAll);
                        if (l) {
                            json.push(l);
                        }
                    });
                   
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
                    if (!layer instanceof ol.layer.Layer) {
                        return;
                    }

                    // Check if the layer is foreigner 
                    if (layer.get('saveState')) {
                        saveAll = true; // If so, make sure we save all the attributes
                    }

                    // Common stuff 

                    // type
                    //json.className = layer.CLASS_NAME;
                    //json.origClassName = layer.CLASS_NAME; // the original type

                    // options
                    json.visibility = layer.getVisible();
                    json.opacity = layer.getOpacity();
                    json.title = layer.get('title');
                    //json.index = layer.map.getLayerIndex(layer);
                    json.path = layer.get('path');

                    if (saveAll) {
                        if (layer.getExtent()) {
                            var ex = layer.getExtent();
                            json.maxExtent = {left:ex[0], bottom:ex[3], right: ex[2], top: ex[1]};
                        }

                        // HTTPRequest
                        if (layer instanceof ol.layer.Tile || layer instanceof ol.layer.Image) {
                            var src = layer.getSource();
                            if (src instanceof ol.source.ImageWMS ||  src instanceof ol.source.TileWMS) {
                                json.className = "HSLayers.Layer.WMS";
                                json.wmsMinScale = layer.get('minScale');
                                json.wmsMaxScale = layer.get('maxScale');
                                json.maxResolution= layer.getMaxResolution();
                                json.minResolution= layer.getMinResolution();
                                json.url = src.getUrl();
                                json.projection = src.getProjection().getCode().toLowerCase();
                                json.params = src.getParams();
                                json.ratio = src.get('ratio');
                                json.displayInLayerSwitcher = layer.get('show_in_manager');
                                json.metadata.styles = src.get('styles');
                            }
                        }

                        // Vector 
                        if (layer instanceof ol.layer.Vector) {
                            /* RB. Will be implemented later
                             *this._saveVectorLayer(json, layer);
                             */
                        }

                        // image
                        if (layer instanceof ol.layer.Image) {
                            /* RB. Will be implemented later
                             * this._saveImageLayer(json, layer);
                             */
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

                $scope.getCurrentExtent = function() {
                    var b = OlMap.map.getView().calculateExtent(OlMap.map.getSize());
                    var pair1 = [b[0], b[1]]
                    var pair2 = [b[2], b[3]];
                    var cur_proj = OlMap.map.getView().getProjection().getCode();
                    pair1 = ol.proj.transform(pair1, cur_proj, 'EPSG:4326');
                    pair2 = ol.proj.transform(pair2, cur_proj, 'EPSG:4326');
                    $scope.bbox = [pair1[0].toFixed(8), pair1[1].toFixed(8), pair2[0].toFixed(8), pair2[1].toFixed(8)];
                }

                $scope.download = function() {
                    if (console) console.log(status_creator.map2json(OlMap.map, $scope, false));
                }

                $scope.getCurrentExtent();
            }
        ]);

    })
