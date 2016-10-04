/**
 * @namespace hs.draw
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'core', 'utils'],

    function(angular, ol) {
        angular.module('hs.draw', ['hs.map', 'hs.core', 'hs.utils'])
            .directive('hs.draw.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/draw/partials/draw.html?bust=' + gitsha
                };
            })

        .directive('hs.draw.toolbarButtonDirective', function() {
            return {
                templateUrl: hsl_path + 'components/draw/partials/toolbar_button_directive.html?bust=' + gitsha
            };
        })

        .controller('hs.draw.controller', ['$scope', 'hs.map.service', 'Core', 'hs.geolocation.service', '$http', 'hs.utils.service', '$timeout', 'hs.status_creator.service', 'config',
            function($scope, OlMap, Core, Geolocation, $http, utils, $timeout, status_creator, config) {
                var map = OlMap.map;
                var draw; 
                var modify; 
                var selector;
                var current_feature_collection = new ol.Collection();
                
                $scope.senslog_url = config.senslog_url; //http://portal.sdi4apps.eu/SensLog-VGI/rest/vgi
                $scope.features = [];
                $scope.current_feature = null;
                $scope.type = 'Point';
                $scope.layer_to_select = ""; //Which layer to select when the panel is activated. This is set in layer manager when adding a new layer.

                $scope.categories = [];

                var attrs_with_template_tags = ['category_id', 'dataset_id', 'description', 'name'];
                var attrs_not_editable = ['geometry', 'highlighted', 'attributes', 'sync_pending'];

                var source;
                var highlighted_style = function(feature, resolution) {
                    return [new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: 'rgba(255, 255, 255, 0.4)'
                        }),
                        stroke: new ol.style.Stroke({
                            color: '#d00504',
                            width: 2
                        }),
                        image: new ol.style.Circle({
                            radius: 5,
                            fill: new ol.style.Fill({
                                color: '#d11514'
                            }),
                            stroke: new ol.style.Stroke({
                                color:  '#d00504',
                                width: 2
                            })
                        })
                    })]
                };

                $scope.drawable_layers = [];

                $scope.changeLayer = function() {
                    angular.forEach(map.getLayers(), function(layer) {
                        if ($scope.selected_layer == layer.get('title')) {
                            $scope.layer_to_select = layer;
                            source = layer.getSource();
                            $scope.deactivateDrawing();
                            addInteraction();
                            fillFeatureList();
                        }
                    })
                }

                function fillFeatureList() {
                    deselectCurrentFeature();
                    $scope.features = [];
                    angular.forEach(source.getFeatures(), function(feature) {
                        if(angular.isUndefined(feature.getId())){
                            feature.setId(utils.generateUuid());
                        }
                        $scope.features.push({
                            type: feature.getGeometry().getType(),
                            uuid: feature.getId(),
                            ol_feature: feature,
                            name: feature.get('name') || (angular.isDefined(feature.get('attributes')) ? feature.get('attributes').name : undefined),
                            time_stamp: feature.get('time_stamp') || getCurrentTimestamp()
                        });
                    })
                }

                function addInteraction() {
                    draw = new ol.interaction.Draw({
                        source: source,
                        type: /** @type {ol.geom.GeometryType} */ ($scope.type)
                    });
                    
                    draw.setActive(false);
                    
                    modify = new ol.interaction.Modify({
                        features: current_feature_collection
                    });
                    
                    selector = new ol.interaction.Select({
                        condition: ol.events.condition.click
                    });

                    map.addInteraction(draw);
                    map.addInteraction(modify);
                    map.addInteraction(selector);
                    
                    draw.on('drawstart',
                        function(evt) {
                            modify.setActive(false);
                            evt.feature.setId(utils.generateUuid());
                            $scope.features.push({
                                type: $scope.type,
                                uuid: evt.feature.getId(),
                                ol_feature: evt.feature,
                                time_stamp: getCurrentTimestamp(),
                                dataset_id: source.get('dataset_id')
                            });
                            if (!$scope.$$phase) $scope.$digest();
                            $scope.setCurrentFeature($scope.features[$scope.features.length - 1], false);
                        }, this);

                    draw.on('drawend',
                        function(evt) {
                            $scope.$emit('feature_drawn', {
                                layer: $scope.selected_layer,
                                features: status_creator.serializeFeatures([evt.feature])
                            });
                            draw.setActive(false);
                            if (!$scope.$$phase) $scope.$digest();
                        }, this);
                    
                    selector.getFeatures().on('add', function(e) {
                        angular.forEach($scope.features, function(container_feature){
                            if(container_feature.ol_feature == e.element){
                                deselectCurrentFeature();
                                $scope.setCurrentFeature(container_feature, false);
                                if (!$scope.$$phase) $scope.$digest();
                            }
                        })
                    });
                    
                    selector.getFeatures().on('remove', function(e) {
                        deselectCurrentFeature();
                        if (!$scope.$$phase) $scope.$digest();
                    });
                }

                $scope.setType = function(what) {
                    $scope.type = what;
                }

                $scope.stop = function() {
                    try {
                        if (draw.getActive()) draw.finishDrawing();
                    } catch (ex) {}
                    deselectCurrentFeature();
                    draw.setActive(false);
                    modify.setActive(false);
                }

                $scope.start = function() {
                    try {
                        if (draw.getActive()) draw.finishDrawing();
                    } catch (ex) {}
                    draw.setActive(true);
                }

                $scope.newPointFromGps = function() {
                    var requiredPrecision = 20;

                    function createPoint() {
                        pos = Geolocation.last_location;
                        var g_feature = new ol.geom.Point(pos.latlng);
                        var feature = new ol.Feature({
                            geometry: g_feature
                        });
                        source.addFeature(feature);
                        $scope.features.push({
                            type: $scope.type,
                            ol_feature: feature,
                            time_stamp: getCurrentTimestamp()
                        });
                        if ($scope.is_unsaved) return;
                        if (!$scope.$$phase) $scope.$digest();
                        $scope.setCurrentFeature($scope.features[$scope.features.length - 1]);
                    }

                    function waitForFix() {
                        window.plugins.toast.showShortCenter("Waiting for GPS fix …");
                        var stopWaiting = $scope.$on('geolocation.updated', function(event) {
                            console.log(Geolocation.last_location.geoposition.coords.accuracy);
                            if (Geolocation.last_location.geoposition.coords.accuracy < requiredPrecision) {
                                createPoint();
                                stopWaiting();
                            }
                        });
                    }

                    if (Geolocation.gpsStatus && Geolocation.last_location.geoposition.coords.accuracy < requiredPrecision) {
                        createPoint();
                    } else if (Geolocation.gpsStatus) {
                        waitForFix();
                    } else {
                        Geolocation.toggleGps();
                        waitForFix();
                    }
                    // pos = Geolocation.last_location; //TODO timestamp is stored in Geolocation.last_location.geolocation.timestamp, it might be a good idea to accept only recent enough positions ---> or wait for the next fix <---.
                }

                $scope.addPhoto = function() {
                    navigator.camera.getPicture(cameraSuccess, cameraError, {
                        encodingType: Camera.EncodingType.PNG,
                        quality: 50,
                        correctOrientation: true,
                        saveToPhotoAlbum: true
                    });

                    function cameraSuccess(imageData) {
                        window.resolveLocalFileSystemURL(imageData, function(fileEntry) {
                            fileEntry.file(function(file) {
                                var reader = new FileReader();

                                reader.onloadend = function() {
                                    var image = new Blob([this.result], {
                                        type: "image/png"
                                    });
                                    $scope.current_feature.photo = image;
                                    $scope.current_feature.photo_src = window.URL.createObjectURL(image);
                                    $scope.$apply();
                                };

                                reader.readAsArrayBuffer(file);
                            });
                        });

                        // $scope.current_feature.photo_src = imageData;
                    }

                    function cameraError(error) {
                        console.log(error);
                    }
                }
                

                /**
                 * @function setCurrentFeature
                 * @memberOf hs.draw.controller
                 * @description Opens list of feature attributes 
                 * @param {object} feature - Wrapped feature to edit or view
                 * @param {number} index - Used to position the detail panel after layers li element
                 */
                $scope.setCurrentFeature = function(feature, zoom_to_feature) {
                    deselectCurrentFeature();
                    $scope.current_feature = feature;
                    $(".hs-dr-editpanel").insertAfter($("#hs-dr-feature-"+feature.uuid));
                    $('#panelplace').animate({
                        scrollTop: $('#panelplace').scrollTop() + $(".hs-dr-editpanel").offset().top
                    }, 500);
                    //$(".hs-dr-editpanel").get(0).scrollIntoView();
                    var olf = $scope.current_feature.ol_feature;
                    fillFeatureContainer($scope.current_feature, olf);
                    current_feature_collection.push(olf);
                    if(!draw.getActive()) modify.setActive(true);
                    olf.setStyle(highlighted_style);
                    if (angular.isUndefined(zoom_to_feature) || zoom_to_feature == true) zoomToFeature(olf);
                    return false;
                }

                //Fill feature container object, because we cant edit attributes in OL feature directly
                function fillFeatureContainer(cf, olf) {
                    cf.extra_attributes = [];
                    angular.forEach(olf.getKeys(), function(key) {
                        if (attrs_not_editable.indexOf(key) == -1) {
                            cf[key] = olf.get(key);
                        }
                        if (attrs_not_editable.indexOf(key) == -1 && attrs_with_template_tags.indexOf(key) == -1) {
                            cf.extra_attributes.push({
                                name: key,
                                value: olf.get(key)
                            });
                        }
                    });
                    angular.forEach(olf.get('attributes'), function(val, key) {
                        if (attrs_not_editable.indexOf(key) == -1) {
                            cf[key] = olf.get(key);
                        }
                        if (attrs_not_editable.indexOf(key) == -1 && attrs_with_template_tags.indexOf(key) == -1) {
                            cf.extra_attributes.push({
                                name: key,
                                value: val
                            });
                        } else if (attrs_with_template_tags.indexOf(key) > -1) {
                            cf[key] = val;
                        }
                    });
                }

                function zoomToFeature(olf) {
                    if (olf.getGeometry().getType() == 'Point') {
                        map.getView().setCenter(olf.getGeometry().getCoordinates());
                    } else {
                        map.getView().fit(olf.getGeometry(), map.getSize());
                    }
                }

                $scope.saveFeature = function() {
                    var cf = $scope.current_feature;
                    var olf = cf.ol_feature;
                    olf.set('name', cf.name);
                    olf.set('description', cf.description);
                    olf.set('category_id', cf.category_id);
                    olf.set('dataset_id', cf.dataset_id);
                    olf.set('photo', cf.photo);
                    olf.set('photo_src', cf.photo_src)
                    olf.set('sync_pending', cf.dataset_id);
                    angular.forEach(cf.extra_attributes, function(attr) {
                        olf.set(attr.name, attr.value);
                    });
                    $scope.is_unsaved = false;
                }

                $scope.setUnsaved = function() {
                    $scope.is_unsaved = true;
                }

                $scope.cancelChanges = function() {
                    $scope.is_unsaved = false;
                    $scope.current_feature = null;
                }

                $scope.setType = function(type) {
                    $scope.type = type;
                    if (!$scope.$$phase) $scope.$digest();
                }

                $scope.clearAll = function() {
                    $scope.features = [];
                    source.clear();
                    if (!$scope.$$phase) $scope.$digest();
                }

                $("#hs-more-attributes").on('shown.bs.collapse', function() {
                    $('.hs-dr-extra-attribute-name:last').focus();
                    $('#panelplace').animate({
                        scrollTop: $('#panelplace').scrollTop() + $(".hs-dr-add-attribute").offset().top - 100
                    }, 500);
                });

                $scope.addUserDefinedAttr = function() {
                    $scope.current_feature.extra_attributes.push({
                        name: "New attribute",
                        value: "New value"
                    });
                    $("#hs-more-attributes").collapse('show');
                    $timeout(function() {
                        $('.hs-dr-extra-attribute-name:last').focus();
                    });
                }

                $scope.removeFeature = function(feature) {
                    if (confirm("Really delete the feature?")) {
                        if ($scope.current_feature == feature) {
                            deselectCurrentFeature();
                        }
                        $scope.features.splice($scope.features.indexOf(feature), 1);
                        source.removeFeature(feature.ol_feature);
                        $scope.$emit('feature_deleted', {
                            layer: $scope.selected_layer,
                            feature_id: feature.ol_feature.getId()
                        });
                    }
                }

                function deselectCurrentFeature() {
                    if (angular.isObject($scope.current_feature)) {
                        $(".hs-dr-editpanel").insertAfter($('.hs-dr-featurelist'));
                        if(angular.isUndefined($scope.current_feature)) return;
                        $scope.current_feature.ol_feature.setStyle(undefined);
                        current_feature_collection.clear();
                    }
                    $scope.current_feature = null;
                }

                $scope.setFeatureStyle = function(new_style) {
                    style = new_style;
                    vector.setStyle(new_style);
                }

                $scope.$watch('type', function() {
                    if (Core.mainpanel != 'draw') return;
                    $scope.deactivateDrawing();
                    addInteraction();
                });

                $scope.activateDrawing = function() {
                    addInteraction();
                }

                $scope.deactivateDrawing = function() {
                    map.removeInteraction(draw);
                    map.removeInteraction(modify);
                    map.removeInteraction(selector);
                }

                $scope.$on('core.mainpanel_changed', function(event) {
                    if (Core.mainpanel == 'draw') {
                        fillDrawableLayersList();
                        if ($scope.drawable_layers.length == 1) {
                            $scope.selected_layer = $scope.drawable_layers[0].get('title');
                            $scope.changeLayer();
                        } else if ($scope.drawable_layers.length > 1) {
                            $scope.activateDrawing();
                        }
                    } else {
                        $scope.deactivateDrawing();
                    }
                });

                function fillDrawableLayersList() {
                    $scope.drawable_layers = [];
                    angular.forEach(map.getLayers(), function(layer) {
                        if (layer instanceof ol.layer.Vector && layer.getVisible() && (angular.isUndefined(layer.get('show_in_manager')) || layer.get('show_in_manager') == true) && (angular.isDefined(layer.get('title')) && layer.get('title') != '')) {
                            $scope.drawable_layers.push(layer);
                            if (layer == $scope.layer_to_select) {
                                $scope.selected_layer = layer.get('title');
                                source = layer.getSource();
                                fillFeatureList();
                            }
                        }
                    })
                }

                function getCurrentTimestamp() {
                    var d = new Date();
                    return d.toISOString();
                }

                $scope.sync = function() {
                    angular.forEach($scope.features, function(feature) {
                        var olf = feature.ol_feature;
                        var attributes = {};
                        angular.forEach(olf.getKeys(), function(key) {
                            if (attrs_not_editable.indexOf(key) == -1 && key != 'category_id' && key != 'description' && key != 'dataset_id') {
                                attributes[key] = olf.get(key);
                            }
                        });
                        var cord = ol.proj.transform(olf.getGeometry().getCoordinates(), OlMap.map.getView().getProjection(), 'EPSG:4326');

                        var fd = new FormData();
                        fd.append('timestamp', getCurrentTimestamp());
                        fd.append('category', olf.get('category_id'));
                        fd.append('description', olf.get('description'));
                        fd.append('lon', cord[0]);
                        fd.append('lat', cord[1]);
                        fd.append('user_id', 'tester');
                        fd.append('dataset', olf.get('dataset_id') || 999);
                        fd.append('unitId', '1111');
                        fd.append('media', olf.get('photo'));
                        fd.append('attributes', JSON.stringify(attributes));
                        if (angular.isDefined(olf.get('sync_pending')) && olf.get('sync_pending') && angular.isDefined(olf.get('obs_vgi_id'))) {
                            fd.append('obs_vgi_id', olf.get('obs_vgi_id'));
                        }

                        if (angular.isUndefined(olf.get('obs_vgi_id')) || (angular.isDefined(olf.get('sync_pending')) && olf.get('sync_pending'))) { //INSERT
                            $http.post($scope.senslog_url + '/insobs', fd, {
                                transformRequest: angular.identity,
                                headers: {
                                    'Content-Type': undefined
                                },
                                olf: olf
                            }).then(function(response) {
                                if (response.statusText == "OK") {
                                    var olf = response.config.olf;
                                    olf.set('sync_pending', false);
                                    if (angular.isUndefined(olf.get('obs_vgi_id')))
                                        olf.set('obs_vgi_id', parseInt(response.data));
                                }
                            });
                        }
                    })
                }
                
                $scope.setLayerToSelect = function(layer) {
                    $scope.layer_to_select = layer;
                }

                $scope.$on('senslog.categories_loaded', function(event, categories) {
                    $scope.categories = categories;
                })

                $scope.$on('senslog.datasets_loaded', function(event, datasets) {
                    $scope.datasets = datasets;
                })

                $scope.sync();

                $scope.$emit('scope_loaded', "Draw");
            }
        ]);
    })
