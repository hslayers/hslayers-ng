/**
 * @namespace hs.draw
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'core', 'utils'],

    function(angular, ol) {
        angular.module('hs.draw', ['hs.map', 'hs.core', 'hs.utils'])
            /**
            * @name hs.draw.directive
            * @ngdoc directive
            * @memberof hs.draw
            * @description Display draw feature panel in map. Panel contains active layer selector, geometry selector and information editor for new features.
            */
            .directive('hs.draw.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/draw/partials/draw.html?bust=' + gitsha
                };
            })

        /**
        * @name hs.draw.toolbarButtonDirective
        * @ngdoc directive
        * @memberof hs.draw
        * @description Display draw toolbar button in map
        */
        .directive('hs.draw.toolbarButtonDirective', function() {
            return {
                templateUrl: hsl_path + 'components/draw/partials/toolbar_button_directive.html?bust=' + gitsha
            };
        })

        /**
        * @name hs.draw.controller
        * @ngdoc controller
        * @memberof hs.draw
        * @description Controller for draw
        */
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
                currentFeature = $scope.current_feature;
                $scope.type = 'Point';
                $scope.image_type = 'image/jpeg';
                $scope.layer_to_select = ""; //Which layer to select when the panel is activated. This is set in layer manager when adding a new layer.

                $scope.categories = [];

                var attrs_with_template_tags = ['category_id', 'dataset_id', 'description', 'name'];
                var attrs_not_editable = ['geometry', 'highlighted', 'attributes', 'sync_pending'];
                var attrs_dont_send = ['media_count', 'obs_vgi_id', 'time_stamp', 'unit_id', 'time_received', 'dop', 'alt', 'photo', 'photo_src']

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
                                color: '#d00504',
                                width: 2
                            })
                        })
                    })]
                };

                $scope.drawable_layers = [];

                /**
                 * @function changeLayer
                 * @memberOf hs.draw.controller
                 * Change active layer for drawing and restart drawing interaction.
                 */
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

                /**
                 * @function changeLayer
                 * @memberOf hs.draw.controller
                 * (PRIVATE) Refill features list
                 */
                function fillFeatureList() {
                    deselectCurrentFeature();
                    $scope.features = [];
                    angular.forEach(source.getFeatures(), function(feature) {
                        if (angular.isUndefined(feature.getId())) {
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

                /**
                 * @function changeLayer
                 * @memberOf hs.draw.controller
                 * (PRIVATE) Add drawing interaction to map. Partial interactions are Draw, Modify and Select. Add Event listeners for drawstart, drawend and (de)selection of feature.
                 */
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
                        angular.forEach($scope.features, function(container_feature) {
                            if (container_feature.ol_feature == e.element) {
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

                /**
                 * @function setType 
                 * @memberOf hs.draw.controller
                 * @params {} what
                 * DUPLICATE?
                 */
                $scope.setType = function(what) {
                    $scope.type = what;
                }

                /**
                 * @function stop
                 * @memberOf hs.draw.controller
                 * Stops current drawing and deactive draw and modify interaction (they are still enable).
                 */
                $scope.stop = function() {
                    try {
                        if (draw.getActive()) draw.finishDrawing();
                    } catch (ex) {}
                    deselectCurrentFeature();
                    draw.setActive(false);
                    modify.setActive(false);
                }

                /**
                 * @function changeLayer
                 * @memberOf hs.draw.controller
                 * Start new drawing interaction
                 */
                $scope.start = function() {
                    try {
                        if (draw.getActive()) draw.finishDrawing();
                    } catch (ex) {}
                    draw.setActive(true);
                }

                /**
                 * @function newPointFromGps
                 * @memberOf hs.draw.controller
                 * Get position for GPS point with minimal required precion (currently 20 m)
                 */
                $scope.newPointFromGps = function() {
                    var requiredPrecision = 20;

                    function createPoint(pos) {
                        var g_feature = pos ? new ol.geom.Point(pos.latlng) : new ol.geom.Point(ol.proj.transform([0, 0], 'EPSG:4326', OlMap.map.getView().getProjection()));
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
                        if (!pos) {
                            $scope.setCurrentFeature($scope.features[$scope.features.length - 1], false);
                        } else {
                            $scope.setCurrentFeature($scope.features[$scope.features.length - 1]);
                        }
                    }

                    function waitForFix() {
                        if (!Geolocation.gpsStatus) {
                            Geolocation.toggleGps();
                            createPoint();
                        } else {
                            createPoint(Geolocation.last_location);
                        }

                        window.plugins.toast.showWithOptions({
                            message: "Waiting for GPS fix …",
                            duration: 4000,
                            postion: "bottom",
                            addPixelsY: -40
                        });

                        var stopWaiting = $scope.$on('geolocation.updated', function(event) {
                            console.log(Geolocation.last_location.geoposition.coords.accuracy);
                            if (Geolocation.last_location.geoposition.coords.accuracy < requiredPrecision) {
                                var g_feature = new ol.geom.Point(Geolocation.last_location.latlng);
                                console.log($scope.current_feature.ol_feature.geometry);
                                $scope.current_feature.ol_feature.geometry = g_feature;
                                stopWaiting();
                            }
                        });
                    }

                    if (Geolocation.gpsStatus && Geolocation.last_location.geoposition.coords.accuracy < requiredPrecision) {
                        createPoint(Geolocation.last_location);
                    } else {
                        waitForFix();
                    }
                    // pos = Geolocation.last_location; //TODO timestamp is stored in Geolocation.last_location.geolocation.timestamp, it might be a good idea to accept only recent enough positions ---> or wait for the next fix <---.
                }

                /**
                 * @function collectProperties
                 * @memberOf hs.draw.controller
                 * @params {} media
                 * @params {} prop
                 * TODO
                 */
                function collectProperties(media, prop) {
                    var props = [];
                    angular.forEach(media, function(d) {
                        props.push(d[prop]);
                    });
                    return props;
                }

                /**
                 * @function addPhoto
                 * @memberOf hs.draw.controller
                 * Create photo from system camera and save it in media folder.
                 */
                $scope.addPhoto = function() {
                    navigator.camera.getPicture(cameraSuccess, cameraError, {
                        encodingType: Camera.EncodingType.JPEG,
                        quality: 25,
                        correctOrientation: true,
                        saveToPhotoAlbum: true
                    });

                    function cameraSuccess(imageData) {
                        window.resolveLocalFileSystemURL(imageData, function(fileEntry) {
                            var fileName = imageData.split("/").slice(-1)[0];
                            var imgFolder = "media";
                            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSys) {
                                fileSys.root.getDirectory(imgFolder, {
                                    create: true,
                                    exclusive: false
                                }, function(directory) {
                                    fileEntry.moveTo(directory, fileName, function(entry) {
                                        $scope.current_feature.media.push({
                                            url: entry.nativeURL,
                                            image_type: $scope.image_type
                                        });
                                        $scope.$apply();
                                        if (angular.isDefined($scope.current_feature.ol_feature.get('obs_vgi_id'))) localStorage.setItem($scope.current_feature.ol_feature.get('obs_vgi_id'), JSON.stringify($scope.current_feature.media));
                                    }, function(err) {
                                        console.log(err);
                                    });
                                }, function(err) {
                                    console.log(err);
                                });
                            }, function(err) {
                                console.log(err);
                            });

                            // fileEntry.file(function(file) {
                            //     var reader = new FileReader();

                            //     reader.onloadend = function() {
                            //         image = new Blob([this.result], {
                            //             type: $scope.image_type
                            //         });
                            //         $scope.current_feature.photo = image;
                            //         $scope.$apply();

                            //         window.image = image;
                            //         console.log(image, this.result);
                            //     };

                            //     reader.readAsArrayBuffer(file);
                            // });
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
                 * @param {Object} feature Selected feature to set as current
                 * @param {Boolean} zoom_to_feature If map should zoom on selected feature (true/false), optional
                 * Set current feature to work with from created features list (editing etc)
                 */
                $scope.setCurrentFeature = function(feature, zoom_to_feature) {
                    if ($scope.current_feature == feature) {
                        deselectCurrentFeature();
                    } else {
                        deselectCurrentFeature();
                        $scope.current_feature = feature;
                        $(".hs-dr-editpanel").insertAfter($("#hs-dr-feature-" + feature.uuid));
                        $('#panelplace').animate({
                            scrollTop: $('#panelplace').scrollTop() + $(".hs-dr-editpanel").offset().top
                        }, 500);
                        //$(".hs-dr-editpanel").get(0).scrollIntoView();
                        var olf = $scope.current_feature.ol_feature;
                        fillFeatureContainer($scope.current_feature, olf);
                        current_feature_collection.push(olf);
                        if (!draw.getActive()) modify.setActive(true);
                        olf.setStyle(highlighted_style);
                        if (angular.isUndefined(zoom_to_feature) || zoom_to_feature == true) zoomToFeature(olf);
                    }
                    return false;
                }

                /**
                 * @function fillFeatureContainer
                 * @memberOf hs.draw.controller
                 * @param {Object} cf Current active feature
                 * @param {Ol.feature} olf Ol feature (geometry part of cf)
                 * (PRIVATE) Fill current feature container object, because we cant edit attributes in OL feature directly
                 */
                //Fill feature container object, because we cant edit attributes in OL feature directly
                function fillFeatureContainer(cf, olf) {
                    cf.extra_attributes = [];
                    // if (angular.isDefined(olf.get('obs_vgi_id')) && localStorage.getItem(olf.get('obs_vgi_id'))) {
                    //     cf.media = JSON.parse(localStorage.getItem(olf.get('obs_vgi_id')));
                    //     // TODO: store media info also with information about their origin dataset and (maybe?) senslog url.
                    //     // TODO: store media info in local storage every time media array is changed.
                    // } else {
                    //     cf.media = [];
                    // }
                    cf.media = [];
                    // cf.media = (typeof olf.get(media) !== "undefined") ? olf.get(media) : [];
                    if (angular.isDefined(olf.get('media_count')) && angular.isDefined(olf.get('obs_vgi_id')) && olf.get('media_count')) {
                        var props = collectProperties(cf.media, 'media_id');
                        $http.get($scope.senslog_url + "/observation/" + olf.get('obs_vgi_id') + "/media?user_name=tester").then(function(response) {
                            angular.forEach(response.data, function(media) {
                                if (props.indexOf(media.media_id) == -1) {
                                    cf.media.push({
                                        media_id: media.media_id,
                                        url: $scope.senslog_url + "/observation/" + olf.get('obs_vgi_id') + "/media/" + media.media_id + "?user_name=tester",
                                        thumbnail_url: $scope.senslog_url + "/observation/" + olf.get('obs_vgi_id') + "/media/" + media.media_id + "/thumbnail?user_name=tester",
                                        image_type: $scope.image_type
                                    });
                                } else {
                                    var pos = props.indexOf(media.media_id);
                                    // TODO: check also if the file is available/valid to prevent missing images.
                                    if (cf.media[pos].media_id == media.media_id) {
                                        var med = cf.media[pos];
                                        med.url = (angular.isDefined(med.url) && med.url.split("/")[0] == "file:") ? med.url : $scope.senslog_url + "/observation/" + olf.get('obs_vgi_id') + "/media/" + media.media_id + "?user_name=tester";
                                        med.thumbnail_url = (angular.isDefined(med.thumbnail_url) && med.thumbnail_url.split("/")[0] == "file:") ? med.thumbnail_url : $scope.senslog_url + "/observation/" + olf.get('obs_vgi_id') + "/media/" + media.media_id + "/thumbnail?user_name=tester";
                                        med.image_type = (angular.isDefined(med.image_type)) ? med.image_type : $scope.image_type;
                                    }
                                }
                            });
                        });
                    }
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

                /**
                 * @function zoomToFeature
                 * @memberOf hs.draw.controller
                 * @param {Ol.feature} olf Feature to zoom to 
                 * (PRIVATE) Zoom to selected feature (center for point, fit view for other types)
                 */
                function zoomToFeature(olf) {
                    if (olf.getGeometry().getType() == 'Point') {
                        map.getView().setCenter(olf.getGeometry().getCoordinates());
                    } else {
                        map.getView().fit(olf.getGeometry(), map.getSize());
                    }
                }

                /**
                 * @function saveFeature
                 * @memberOf hs.draw.controller
                 * Saves current features atributtes
                 */
                $scope.saveFeature = function() {
                    var cf = $scope.current_feature;
                    var olf = cf.ol_feature;
                    var pic = cf.media[cf.media.length - 1];
                    if (pic.url.split("/")[0] == "file:") {
                        window.resolveLocalFileSystemURL(pic.url, function(fileEntry) {
                            fileEntry.file(function(file) {
                                var reader = new FileReader();
                                reader.onloadend = function() {
                                    image = new Blob([this.result], {
                                        type: pic.image_type
                                    });
                                    olf.set('photo', image);
                                    olf.set('image_type', pic.image_type);
                                    console.log(image, this.result, olf.get('photo'));
                                    $scope.sync();
                                }
                                reader.readAsArrayBuffer(file);
                            });
                        });
                    } else {
                        $scope.sync();
                    }
                    olf.set('name', cf.name);
                    olf.set('description', cf.description);
                    olf.set('category_id', cf.category_id);
                    olf.set('dataset_id', cf.dataset_id);
                    olf.set('sync_pending', cf.dataset_id);
                    angular.forEach(cf.extra_attributes, function(attr) {
                        olf.set(attr.name, attr.value);
                    });
                    $scope.is_unsaved = false;
                }

                /**
                 * @function setUnsaved
                 * @memberOf hs.draw.controller
                 * Set current work state as unsaved
                 */
                $scope.setUnsaved = function() {
                    $scope.is_unsaved = true;
                }

                /**
                 * @function cancelChanes
                 * @memberOf hs.draw.controller
                 * Reset changes done to feature without saving
                 */
                $scope.cancelChanges = function() {
                    $scope.is_unsaved = false;
                    $scope.current_feature = null;
                }

                /**
                 * @function setType
                 * @memberOf hs.draw.controller
                 * @param {String} type Type of feature to set (Point / Linestring / Polygon) 
                 * Change current type of geometry for new features
                 */
                $scope.setType = function(type) {
                    $scope.type = type;
                    if (!$scope.$$phase) $scope.$digest();
                }

                /**
                 * @function clearAll
                 * @memberOf hs.draw.controller
                 * Delete all created features if confirmed
                 */
                $scope.clearAll = function() {
                    if (confirm("Really clear all features?")) {
                        $scope.features = [];
                        source.clear();
                        if (!$scope.$$phase) $scope.$digest();
                    }
                }

                $("#hs-more-attributes").on('shown.bs.collapse', function() {
                    $('.hs-dr-extra-attribute-name:last').focus();
                    $('#panelplace').animate({
                        scrollTop: $('#panelplace').scrollTop() + $(".hs-dr-add-attribute").offset().top - 100
                    }, 500);
                });

                /**
                 * @function addUserDefinedAttr
                 * @memberOf hs.draw.controller
                 * Add user defined attribute to current feature and expand menu if collapsed
                 */
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

                /**
                 * @function deleteVgiObservation
                 * @memberOf hs.draw.controller
                 * @param {Ol.feature} olf Ol feature part of selected feature
                 * (PRIVATE) Delete VGI observation from remote senslog server
                 */
                function deleteVgiObservation(olf) {
                    $http.delete($scope.senslog_url + '/observation/' + olf.get('obs_vgi_id') + '?user_name=tester').then(function(response) {
                        console.log(response);
                    });
                }

                /**
                 * @function removeFeature
                 * @memberOf hs.draw.controller
                 * @param {Object} feature Selected feature to remove 
                 * Remove selected feature from created features list and from map
                 */
                $scope.removeFeature = function(feature) {
                    if (confirm("Really delete the feature?")) {
                        var cf = $scope.current_feature;
                        var olf = cf.ol_feature;
                        if (cf == feature && angular.isDefined(olf.get('obs_vgi_id'))) {
                            deleteVgiObservation(olf);
                        } else if (cf == feature) {
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

                /**
                 * @function deleteCurrentFeature
                 * @memberOf hs.draw.controller
                 * (PRIVATE) Deselect currently selected feature, feauture stays inactive until it is selected again.
                 */
                function deselectCurrentFeature() {
                    if (angular.isObject($scope.current_feature)) {
                        $(".hs-dr-editpanel").insertAfter($('.hs-dr-featurelist'));
                        if (angular.isUndefined($scope.current_feature)) return;
                        $scope.current_feature.ol_feature.setStyle(undefined);
                        current_feature_collection.clear();
                    }
                    $scope.current_feature = null;
                }

                /**
                 * @function setFeatureStyle
                 * @memberOf hs.draw.controller
                 * @param {Ol.style.style} new_style
                 * DEPRACATED? vector undefined
                 */
                $scope.setFeatureStyle = function(new_style) {
                    style = new_style;
                    vector.setStyle(new_style);
                }

                $scope.$watch('type', function() {
                    if (Core.mainpanel != 'draw') return;
                    $scope.deactivateDrawing();
                    addInteraction();
                });

                /**
                 * @function activateDrawing
                 * @memberOf hs.draw.controller
                 * Add drawing interaction to map. Partial interactions are Draw, Modify and Select. Add Event listeners for drawstart, drawend and (de)selection of feature.
                 */
                $scope.activateDrawing = function() {
                    addInteraction();
                }

                /**
                 * @function deactivateDrawing
                 * @memberOf hs.draw.controller
                 * Deactivate all hs.draw interaction in map (Draw, Modify, Select)
                 */
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

                /**
                 * @function fillDrawableLayersList
                 * @memberOf hs.draw.controller
                 * (PRIVATE) Finds all layers in app which are drawable
                 */
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

                /**
                 * @function getCurrentTimestamp
                 * @memberOf hs.draw.controller
                 * (PRIVATE) Get current timestamp
                 */
                function getCurrentTimestamp() {
                    var d = new Date();
                    return d.toISOString();
                }

                /**
                 * @function sync
                 * @memberOf hs.draw.controller
                 * Sync created points with Senslog server
                 */
                $scope.sync = function() {
                    angular.forEach($scope.features, function(feature) {
                        var olf = feature.ol_feature;
                        var attributes = {};
                        angular.forEach(olf.getKeys(), function(key) {
                            if (attrs_not_editable.indexOf(key) == -1 && attrs_dont_send.indexOf(key) == -1 && key != 'category_id' && key != 'description' && key != 'dataset_id') {
                                attributes[key] = olf.get(key);
                            }
                        });
                        var cord = ol.proj.transform(olf.getGeometry().getCoordinates(), OlMap.map.getView().getProjection(), 'EPSG:4326');

                        var fd = new FormData();
                        fd.append('time_stamp', getCurrentTimestamp());
                        fd.append('category_id', olf.get('category_id') /*|| 0*/ );
                        if (olf.get('description')) fd.append('description', olf.get('description'));
                        fd.append('lon', cord[0]);
                        fd.append('lat', cord[1]);
                        fd.append('dataset_id', olf.get('dataset_id') || 999);
                        fd.append('unit_id', '1111');
                        // TODO: hand only the last image to the form data object?
                        if (olf.get('photo')) {
                            fd.append('media', olf.get('photo'));
                            fd.append('media_type', olf.get('image_type'));
                        }

                        if (!angular.equals(attributes, {})) fd.append('attributes', JSON.stringify(attributes));
                        if (angular.isDefined(olf.get('sync_pending')) && olf.get('sync_pending') && angular.isDefined(olf.get('obs_vgi_id'))) {
                            fd.append('obs_vgi_id', olf.get('obs_vgi_id'));
                        }

                        function insertVgiObservation(olf, fd) {
                            // TODO: if there is more than one new media, upload all of them one by one.
                            $http.post($scope.senslog_url + '/observation?user_name=tester', fd, {
                                transformRequest: angular.identity,
                                headers: {
                                    'Content-Type': undefined
                                },
                                olf: olf
                            }).then(function(response) {
                                if (response.statusText == "OK") {
                                    var olf = response.config.olf;
                                    olf.set('sync_pending', false);
                                    if (angular.isUndefined(olf.get('obs_vgi_id'))) olf.set('obs_vgi_id', parseInt(response.data.obs_vgi_id));
                                    if (response.data.media_id) {
                                        var media = olf.get('media');
                                        var props = collectProperties(media, 'media_id');
                                        if (props.indexOf(response.data.media_id) == -1) {
                                            var med = media[props.indexOf(undefined)] // Bad implementation, rewrite to check against local FILE_URL
                                            med.media_id = response.data.media_id;
                                            med.url = (angular.isDefined(med.url) && med.url.split("/")[0] == "file:") ? med.url : $scope.senslog_url + "/observation/" + response.data.obs_vgi_id + "/media/" + response.data.media_id + "?user_name=tester";
                                            med.thumbnail_url = (angular.isDefined(med.thumbnail_url) && med.thumbnail_url.split("/")[0] == "file:") ? med.thumbnail_url : $scope.senslog_url + "/observation/" + response.data.obs_vgi_id + "/media/" + response.data.media_id + "/thumbnail?user_name=tester";
                                        }
                                    }
                                }
                            });
                        }

                        function updateVgiObservation(olf, fd) {
                            // TODO: if there is more than one new media, upload all of them one by one.
                            $http.put($scope.senslog_url + '/observation/' + olf.get('obs_vgi_id') + '?user_name=tester', fd, {
                                transformRequest: angular.identity,
                                headers: {
                                    'Content-Type': undefined
                                },
                                olf: olf
                            }).then(function(response) {
                                if (response.statusText == "OK") {
                                    var olf = response.config.olf;
                                    olf.set('sync_pending', false);
                                    if (response.data.media_id) {
                                        var media = olf.get('media');
                                        var props = collectProperties(media, 'media_id');
                                        if (props.indexOf(response.data.media_id) == -1) {
                                            var med = media[props.indexOf(undefined)] // Bad implementation, rewrite to check against local FILE_URL
                                            med.media_id = response.data.media_id;
                                            med.url = (angular.isDefined(med.url) && med.url.split("/")[0] == "file:") ? med.url : $scope.senslog_url + "/observation/" + response.data.obs_vgi_id + "/media/" + response.data.media_id + "?user_name=tester";
                                            med.thumbnail_url = (angular.isDefined(med.thumbnail_url) && med.thumbnail_url.split("/")[0] == "file:") ? med.thumbnail_url : $scope.senslog_url + "/observation/" + response.data.obs_vgi_id + "/media/" + response.data.media_id + "/thumbnail?user_name=tester";
                                        }
                                    }
                                }
                            });
                        }

                        if (angular.isUndefined(olf.get('obs_vgi_id')) && (angular.isDefined(olf.get('sync_pending')) && olf.get('sync_pending'))) {
                            insertVgiObservation(olf, fd);
                        } else if (angular.isDefined(olf.get('obs_vgi_id')) && (angular.isDefined(olf.get('sync_pending')) && olf.get('sync_pending'))) {
                            updateVgiObservation(olf, fd);
                        }
                    })
                }

                /**
                 * @function setLayerToSelect
                 * @memberOf hs.draw.controller
                 * @params {} layer 
                 *
                 */
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
