import { Polygon, LineString, GeometryType, Point } from 'ol/geom';
import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import { Vector } from 'ol/source';
import { transform } from 'ol/proj';

export default {
    template: require('./partials/vgi-draw.html'),
    controller: ['$scope', 'hs.map.service', 'Core', 'hs.geolocation.service', '$http', 'hs.utils.service', '$timeout', 'hs.save-map.service', 'config', 'hs.draw.service', '$compile', 'hs.layout.service',
        function ($scope, OlMap, Core, Geolocation, $http, utils, $timeout, saveMap, config, drawService, $compile, layoutService) {
            var map = OlMap.map;
            var newObsId = 0;

            $scope.senslog_url = config.senslog_url; //http://portal.sdi4apps.eu/SensLog-VGI/rest/vgi
            $scope.features = [];
            $scope.current_feature = null;
            $scope.image_type = 'image/jpeg';
            $scope.layer_to_select = ""; //Which layer to select when the panel is activated. This is set in layer manager when adding a new layer.

            $scope.categories = [];

            var attrs_with_template_tags = ['category_id', 'dataset_id', 'description', 'name'];
            var attrs_not_editable = ['geometry', 'highlighted', 'attributes', 'sync_pending'];
            var attrs_dont_send = ['media_count', 'obs_vgi_id', 'time_stamp', 'unit_id', 'time_received', 'dop', 'alt', 'media']

            $scope.drawable_layers = [];
            $scope.drawService = drawService;

            /**
             * @function changeLayer
             * @memberOf hs.vgi-draw
             * Change active layer for drawing and restart drawing interaction.
             */
            $scope.changeLayer = function () {
                angular.forEach(map.getLayers(), function (layer) {
                    if ($scope.selected_layer == layer.get('title')) {
                        $scope.layer_to_select = layer;
                        drawService.source = layer.getSource();
                        drawService.deactivateDrawing();
                        activateDrawing();
                        fillFeatureList();
                    }
                })
            }

            function downloadFile(url, success) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.responseType = "blob";
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4) {
                        if (success) success(xhr.response);
                    }
                };
                xhr.send(null);
            }

            function fillFeatureList() {
                deselectCurrentFeature();
                $scope.features = [];
                angular.forEach(drawService.source.getFeatures(), function (feature) {
                    if (angular.isDefined(feature.get('obs_vgi_id')) && feature.get('obs_vgi_id') >= newObsId) newObsId = feature.get('obs_vgi_id') + 1;
                    if (angular.isUndefined(feature.getId())) {
                        feature.setId(utils.generateUuid());
                    }
                    $scope.features.push({
                        type: feature.getGeometry().getType(),
                        uuid: feature.getId(),
                        ol_feature: feature,
                        name: feature.get('name') || (angular.isDefined(feature.get('attributes')) ? feature.get('attributes').name : undefined),
                        media: [],
                        time_stamp: feature.get('time_stamp') || getCurrentTimestamp()
                    });
                    if (feature.get("media_count") && feature.get("obs_vgi_id")) {
                        $http.get($scope.senslog_url + "/observation/" + feature.get("obs_vgi_id") + "/media?user_name=" + config.user_name).then(function (response) {
                            let media = [];
                            if (Core.isMobile()) {
                                var portalFolder = config.hostname.default.url.split("/").slice(-1)[0];
                                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSys) {
                                    fileSys.root.getDirectory(portalFolder, {
                                        create: true,
                                        exclusive: false
                                    }, function (portalDir) {
                                        portalDir.getDirectory("media", {
                                            create: true,
                                            exclusive: false
                                        }, function (mediaDir) {
                                            mediaDir.getDirectory(String(feature.get("obs_vgi_id")), {
                                                create: true,
                                                exclusive: false
                                            }, function (obsDir) {
                                                let dirReader = obsDir.createReader();
                                                let getEntries = function () {
                                                    dirReader.readEntries(function (results) {
                                                        angular.forEach(response.data, function (r) {
                                                            var synced = false;
                                                            var thumb = false;
                                                            var med = null;
                                                            if (results.length) {
                                                                angular.forEach(results, function (x) {
                                                                    if (!x.isDirectory && x.name.split(".")[0] == r.media_id) {
                                                                        synced = true;
                                                                    } else if (x.name.split(".")[0] == r.media_id + "_thumb") {
                                                                        synced = true;
                                                                        thumb = true;
                                                                    }
                                                                });
                                                            }

                                                            if (synced) {
                                                                media.push({
                                                                    media_id: r.media_id,
                                                                    url: !thumb ? obsDir.nativeURL + r.media_id + ".jpg" : undefined,
                                                                    thumbnail_url: thumb ? obsDir.nativeURL + r.media_id + "_thumb.jpg" : undefined,
                                                                    image_type: r.mediaDatatype,
                                                                    synced: synced
                                                                });

                                                                // angular.forEach($scope.features, function(f) {
                                                                //     if (f.ol_feature.get('obs_vgi_id') == feature.get('obs_vgi_id')) {
                                                                //         f.media.push(med);
                                                                //         $scope.$apply();
                                                                //         return;
                                                                //     }
                                                                // });
                                                            } else {
                                                                downloadFile($scope.senslog_url + "/observation/" + feature.get("obs_vgi_id") + "/media/" + r.media_id + "/thumbnail?user_name=" + config.user_name, function (data) {
                                                                    obsDir.getFile(r.media_id + "_thumb.jpg", {
                                                                        create: true
                                                                    }, function (file) {
                                                                        file.createWriter(function (fileWriter) {
                                                                            fileWriter.write(data);
                                                                        });

                                                                        media.push({
                                                                            media_id: r.media_id,
                                                                            thumbnail_url: file.nativeURL,
                                                                            image_type: r.mediaDatatype,
                                                                            synced: true
                                                                        });

                                                                        // angular.forEach($scope.features, function(f) {
                                                                        //     if (f.ol_feature.get('obs_vgi_id') == feature.get('obs_vgi_id')) {
                                                                        //         f.media.push(med);
                                                                        //         $scope.$apply();
                                                                        //         return;
                                                                        //     }
                                                                        // });
                                                                    });
                                                                });
                                                            }

                                                        });
                                                    }, function (error) {
                                                        console.log(error);
                                                    });
                                                };
                                                getEntries();
                                            }, function (err) {
                                                console.log(err);
                                            });
                                        }, function (err) {
                                            console.log(err);
                                        });
                                    }, function (err) {
                                        console.log(err);
                                    });
                                }, function (err) {
                                    console.log(err);
                                });
                            } else {
                                angular.forEach(response.data, function (r) {
                                    media.push({
                                        media_id: r.media_id,
                                        url: $scope.senslog_url + "/observation/" + feature.get("obs_vgi_id") + "/media/" + r.media_id + "?user_name=" + config.user_name,
                                        thumbnail_url: $scope.senslog_url + "/observation/" + feature.get("obs_vgi_id") + "/media/" + r.media_id + "/thumbnail?user_name=" + config.user_name,
                                        image_type: r.mediaDatatype
                                    });
                                });
                            }

                            angular.forEach($scope.features, function (f) {
                                if (f.ol_feature.get('obs_vgi_id') == feature.get('obs_vgi_id')) {
                                    f.media = media;
                                    // $scope.$apply();
                                    return;
                                }
                            });
                        });
                    }
                });
            }

            /**
             * @function setType
             * @memberOf hs.vgi-draw
             * @param {String} type Type of feature to set (Point / Linestring / Polygon) 
             * Change current type of geometry for new features
             */
            $scope.setType = function (what) {
                drawService.type = what;
            }

            /**
             * @function stop
             * @memberOf hs.vgi-draw
             * Stops current drawing and deactive draw and modify interaction (they are still enabled).
             */
            $scope.stop = function () {
                drawService.stopDrawing();
                $scope.saveFeature();
                deselectCurrentFeature();
            }

            /**
             * @function start
             * @memberOf hs.vgi-draw
             * Start new drawing interaction
             */
            $scope.start = function () {
                drawService.startDrawing();
            }

            /**
             * @function newPointFromGps
             * @memberOf hs.vgi-draw
             * Get position for GPS point with minimal required precion (currently 20 m)
             */
            $scope.newPointFromGps = function () {
                var requiredPrecision = 20;

                function createPoint(pos) {
                    var g_feature = pos ? new Point(pos.latlng) : new Point(transform([0, 0], 'EPSG:4326', OlMap.map.getView().getProjection()));
                    var feature = new Feature({
                        geometry: g_feature
                    });
                    feature.setId(utils.generateUuid());
                    drawService.source.addFeature(feature);
                    var f = {
                        type: 'POINT',
                        uuid: feature.getId(),
                        ol_feature: feature,
                        time_stamp: getCurrentTimestamp(),
                        media: [],
                        dataset_id: drawService.source.get('dataset_id')
                    };
                    if ($scope.categories && $scope.categories.length > 0)
                        f.category_id = $scope.categories[0].category_id;
                    $scope.features.push(f);
                    $timeout(function () {
                        if (!pos) {
                            $scope.setCurrentFeature(f, false);
                        } else {
                            $scope.setCurrentFeature(f);
                        }
                    });
                    return f;
                }

                function waitForFix() {
                    var newPoint = null;
                    if (!Geolocation.gpsStatus) {
                        Geolocation.toggleGps();
                        newPoint = createPoint();
                    } else {
                        newPoint = createPoint(Geolocation.last_location);
                    }

                    window.plugins.toast.showWithOptions({
                        message: "Waiting for GPS fix …",
                        duration: 4000,
                        postion: "bottom",
                        addPixelsY: -40
                    });

                    var stopWaiting = $scope.$on('geolocation.updated', function (event) {
                        console.log(event, Geolocation.last_location);
                        if (Geolocation.last_location.geoposition.coords.accuracy < requiredPrecision) {
                            var g_feature = new Point(Geolocation.last_location.latlng);
                            newPoint.ol_feature.setGeometry(g_feature);
                            zoomToFeature(newPoint.ol_feature);
                            stopWaiting();
                        }
                    });
                }

                if (Geolocation.gpsStatus && Geolocation.last_location.geoposition.coords.accuracy < requiredPrecision) {
                    createPoint(Geolocation.last_location);
                } else {
                    waitForFix();
                }
            }

            /**
             * @function collectProperties
             * @memberOf hs.vgi-draw
             * @params {} media
             * @params {} prop
             * TODO
             */
            function collectProperties(media, prop) {
                var props = [];
                angular.forEach(media, function (d) {
                    props.push(d[prop]);
                });
                return props;
            }

            /**
             * @function addPhoto
             * @memberOf hs.vgi-draw
             * Create photo from system camera and save it in media folder.
             */
            $scope.addPhoto = function () {
                navigator.camera.getPicture(cameraSuccess, cameraError, {
                    encodingType: Camera.EncodingType.JPEG,
                    quality: 25,
                    correctOrientation: true,
                    saveToPhotoAlbum: true
                });

                function cameraSuccess(imageData) {
                    window.resolveLocalFileSystemURL(imageData, function (fileEntry) {
                        var fileName = imageData.split("/").slice(-1)[0];
                        // var portalFolder = "media";
                        var portalFolder = config.hostname.default.url.split("/").slice(-1)[0];
                        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSys) {
                            var obsId = angular.isDefined($scope.current_feature.ol_feature.get('obs_vgi_id')) ? $scope.current_feature.ol_feature.get('obs_vgi_id') : -1;
                            var isNew = true;
                            // var hasDir = false;

                            fileSys.root.getDirectory(portalFolder, {
                                create: true,
                                exclusive: false
                            }, function (portalDir) {
                                portalDir.getDirectory("media", {
                                    create: true,
                                    exclusive: false
                                }, function (mediaDir) {
                                    let dirReader = mediaDir.createReader();
                                    let getEntries = function () {
                                        dirReader.readEntries(function (results) {
                                            if (results.length) {
                                                angular.forEach(results, function (x) {
                                                    if (x.isDirectory && angular.isDefined($scope.current_feature.ol_feature.get('obs_vgi_id')) && x.name == $scope.current_feature.ol_feature.get('obs_vgi_id')) {
                                                        isNew = false;
                                                        obsId = $scope.current_feature.ol_feature.get('obs_vgi_id');
                                                    } else if (isNew && x.isDirectory && x.name >= obsId) {
                                                        obsId = parseInt(x.name) + 1;
                                                    }
                                                });
                                            }
                                        }, function (error) {
                                            console.log(error);
                                        });
                                    };
                                    getEntries();

                                    if (isNew) {
                                        // assign temporary obsVgiId and move to temp directory
                                        mediaDir.getDirectory("temp", {
                                            create: true,
                                            exclusive: false
                                        }, function (tempDir) {
                                            obsId = angular.isDefined($scope.current_feature.ol_feature.get('temp_obs_id')) ? $scope.current_feature.ol_feature.get('temp_obs_id') : obsId;
                                            let dirReader = tempDir.createReader();
                                            let getEntries = function () {
                                                dirReader.readEntries(function (results) {
                                                    if (results.length) {
                                                        angular.forEach(results, function (x) {
                                                            if (x.isDirectory && angular.isDefined($scope.current_feature.ol_feature.get('temp_obs_id')) && x.name == $scope.current_feature.ol_feature.get('temp_obs_id')) {
                                                                obsId = $scope.current_feature.ol_feature.get('temp_obs_id');
                                                                isNew = false;
                                                            } else if (isNew && x.isDirectory && x.name >= obsId) {
                                                                obsId = parseInt(x.name) + 1;
                                                            }
                                                        });
                                                    }
                                                }, function (error) {
                                                    console.log(error);
                                                });
                                            };
                                            getEntries();
                                            $scope.current_feature.ol_feature.set('temp_obs_id', obsId);
                                            tempDir.getDirectory(String(obsId), {
                                                create: true,
                                                exclusive: false
                                            }, function (obsDir) {
                                                let mediaReader = obsDir.createReader();
                                                let lastMediaId = 0;

                                                angular.forEach($scope.current_feature.media, function (m) {
                                                    if (m.media_id >= lastMediaId) {
                                                        lastMediaId = m.media_id + 1;
                                                    }
                                                });

                                                fileEntry.moveTo(obsDir, lastMediaId + ".jpg", function (entry) {
                                                    $scope.current_feature.media.push({
                                                        url: entry.nativeURL,
                                                        image_type: $scope.image_type,
                                                        media_id: lastMediaId,
                                                        synced: false
                                                    });
                                                    $scope.$apply();
                                                });
                                            })
                                        })
                                    } else {
                                        mediaDir.getDirectory(String(obsId), {
                                            create: true,
                                            exclusive: false
                                        }, function (obsDir) {
                                            obsDir.getDirectory("temp", {
                                                create: true,
                                                exclusive: false
                                            }, function (tempDir) {
                                                let mediaReader = tempDir.createReader();
                                                let lastMediaId = 0;
                                                let getEntries = function () {
                                                    mediaReader.readEntries(function (results) {
                                                        if (results.length) {
                                                            var x;
                                                            angular.forEach(results, function (x) {
                                                                if (!x.isDirectory && x.name.split("_")[0].split(".")[0] >= lastMediaId) {
                                                                    lastMediaId = x.name.split("_")[0].split(".")[0] + 1;
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                                getEntries();
                                                fileEntry.moveTo(tempDir, lastMediaId + ".jpg", function (entry) {
                                                    $scope.current_feature.media.push({
                                                        url: entry.nativeURL,
                                                        image_type: $scope.image_type,
                                                        synced: false
                                                    });
                                                    $scope.$apply();
                                                }, function (err) {
                                                    console.log(err);
                                                });
                                            });
                                        });
                                    }
                                });
                            }, function (err) {
                                console.log(err);
                            });

                        }, function (err) {
                            console.log(err);
                        });
                    });
                }

                function cameraError(error) {
                    console.log(error);
                }
            }

            /**
             * @function setCurrentFeature
             * @memberOf hs.vgi-draw
             * @param {Object} feature Selected feature to set as current
             * @param {Boolean} zoom_to_feature If map should zoom on selected feature (true/false), optional
             * Set current feature to work with from created features list (editing etc)
             */
            $scope.setCurrentFeature = function (feature, zoom_to_feature) {
                if ($scope.current_feature == feature) {
                    $scope.saveFeature();
                    deselectCurrentFeature();
                } else {
                    if (angular.isObject($scope.current_feature)) $scope.saveFeature();
                    deselectCurrentFeature();
                    $scope.current_feature = feature;
                    $timeout(() => {
                        utils.insertAfter(document.querySelector('.hs-dr-editpanel'), document.getElementById("hs-dr-feature-" + feature.uuid));
                        var panelSpace = document.querySelector('#panelplace');
                        panelSpace.scrollTop = panelSpace.scrollTop + document.querySelector("#hs-dr-feature-" + feature.uuid).offsetTop;
                        var olf = $scope.current_feature.ol_feature;
                        fillFeatureContainer($scope.current_feature, olf);
                        drawService.selectedFeatures.push(olf);
                        if (!drawService.draw.getActive()) {
                            drawService.modify.setActive(true);
                        }
                        olf.setStyle(drawService.highlighted_style);
                        if (angular.isUndefined(zoom_to_feature) || zoom_to_feature == true) zoomToFeature(olf);
                    })
                }
                return false;
            }

            /**
             * @function fillFeatureContainer
             * @memberOf hs.vgi-draw
             * @param {Object} cf Current active feature
             * @param {Ol.feature} olf Ol feature (geometry part of cf)
             * (PRIVATE) Fill current feature container object, because we cant edit attributes in OL feature directly
             */
            //Fill feature container object, because we cant edit attributes in OL feature directly
            function fillFeatureContainer(cf, olf) {
                cf.extra_attributes = [];
                angular.forEach(olf.getKeys(), function (key) {
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
                angular.forEach(olf.get('attributes'), function (val, key) {
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
             * @memberOf hs.vgi-draw
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
             * @memberOf hs.vgi-draw
             * Saves current features atributtes
             */
            $scope.saveFeature = function (sync) {
                var cf = $scope.current_feature;
                var olf = cf.ol_feature;
                olf.set('media', angular.isDefined(cf.media) ? cf.media : []);
                olf.set('name', cf.name);
                olf.set('description', cf.description);
                olf.set('category_id', cf.category_id);
                olf.set('dataset_id', cf.dataset_id);
                // olf.set('sync_pending', cf.dataset_id);
                olf.set('sync_pending', true);
                angular.forEach(cf.extra_attributes, function (attr) {
                    olf.set(attr.name, attr.value);
                });
                if (sync == true) $scope.sync();
                $scope.is_unsaved = false;
            }

            /**
             * @function setUnsaved
             * @memberOf hs.vgi-draw
             * Set current work state as unsaved
             */
            $scope.setUnsaved = function () {
                $scope.is_unsaved = true;
            }

            /**
             * @function cancelChanes
             * @memberOf hs.vgi-draw
             * Reset changes done to feature without saving
             */
            $scope.cancelChanges = function () {
                $scope.is_unsaved = false;
                $scope.current_feature = null;
            }

            /**
             * @function clearAll
             * @memberOf hs.vgi-draw
             * Delete all created features if confirmed
             */
            $scope.clearAll = function () {
                if (confirm("Really clear all features?")) {
                    $scope.features = [];
                    drawsource.clear();
                }
            }

            /**
             * @function addUserDefinedAttr
             * @memberOf hs.vgi-draw
             * Add user defined attribute to current feature and expand menu if collapsed
             */
            $scope.addUserDefinedAttr = function () {
                $scope.current_feature.extra_attributes.push({
                    name: "New attribute",
                    value: "New value"
                });
                $scope.moreAttributesVisible = true;
                $timeout(function () {
                    document.querySelector('.hs-dr-extra-attribute-name:last').focus();
                });
            }

            /**
             * @function deleteVgiObservation
             * @memberOf hs.vgi-draw
             * @param {Ol.feature} olf Ol feature part of selected feature
             * (PRIVATE) Delete VGI observation from remote senslog server
             */
            function deleteVgiObservation(olf) {
                $http.delete($scope.senslog_url + '/observation/' + olf.get('obs_vgi_id') + '?user_name=' + config.user_name).then(function (response) {
                    console.log(response);
                });
            }

            /**
             * @function removeFeature
             * @memberOf hs.vgi-draw
             * @param {Object} feature Selected feature to remove 
             * Remove selected feature from created features list and from map
             */
            $scope.removeFeature = function (feature) {
                if (confirm("Really delete the feature?")) {
                    var cf = $scope.current_feature;
                    var olf = feature.ol_feature;
                    if (feature == cf) deselectCurrentFeature();
                    if (angular.isDefined(olf.get('obs_vgi_id'))) {
                        $http.delete($scope.senslog_url + '/observation/' + olf.get('obs_vgi_id') + '?user_name=' + config.user_name).then(function (response) {
                            window.plugins.toast.showWithOptions({
                                message: "Feature deleted.",
                                position: "bottom"
                            });
                            console.log(response);
                            var featureId = feature.ol_feature.getId();
                            $scope.features.splice($scope.features.indexOf(feature), 1);
                            drawService.source.removeFeature(feature.ol_feature);
                            $scope.$emit('feature_deleted', {
                                layer: $scope.selected_layer,
                                feature_id: featureId
                            });
                        }, function (response) {
                            window.plugins.toast.showWithOptions({
                                message: "Feature not deleted.",
                                duration: 4000,
                                position: "bottom",
                                styling: {
                                    backgroundColor: '#FF2F2F',
                                    textColor: 'FFFFFF'
                                }
                            });
                        });
                    } else {
                        var featureId = feature.ol_feature.getId();
                        $scope.features.splice($scope.features.indexOf(feature), 1);
                        drawService.source.removeFeature(feature.ol_feature);
                        window.plugins.toast.showWithOptions({
                            message: "Feature deleted.",
                            position: "bottom"
                        });
                        $scope.$emit('feature_deleted', {
                            layer: $scope.selected_layer,
                            feature_id: featureId
                        });
                    }

                    // if (cf == feature && angular.isDefined(olf.get('obs_vgi_id'))) {
                    //     deselectCurrentFeature();
                    //     $http.delete($scope.senslog_url + '/observation/' + olf.get('obs_vgi_id') + '?user_name=' + config.user_name).then(function(response) {
                    //         window.plugins.toast.showWithOptions({
                    //             message: "Feature deleted.",
                    //             postion: "bottom"
                    //         });
                    //         console.log(response);
                    //         var featureId = feature.ol_feature.getId();
                    //         $scope.features.splice($scope.features.indexOf(feature), 1);
                    //         source.removeFeature(feature.ol_feature);
                    //         $scope.$emit('feature_deleted', {
                    //             layer: $scope.selected_layer,
                    //             feature_id: featureId
                    //         });
                    //     }, function(response) {
                    //         window.plugins.toast.showWithOptions({
                    //             message: "Feature not deleted.",
                    //             duration: 4000,
                    //             postion: "bottom",
                    //             styling: {
                    //                 backgroundColor: '#FF2F2F',
                    //                 textColor: 'FFFFFF'
                    //             }
                    //         });
                    //     });
                    //     // deleteVgiObservation(olf);
                    // } else if (cf == feature) {
                    //     deselectCurrentFeature();
                    //     window.plugins.toast.showWithOptions({
                    //             message: "Feature deleted.",
                    //             postion: "bottom"
                    //         });
                    //         console.log(response);
                    //         var featureId = feature.ol_feature.getId();
                    //         $scope.features.splice($scope.features.indexOf(feature), 1);
                    //         source.removeFeature(feature.ol_feature);
                    //         $scope.$emit('feature_deleted', {
                    //             layer: $scope.selected_layer,
                    //             feature_id: featureId
                    //         });
                    // }
                }
            }

            /**
             * @function deleteCurrentFeature
             * @memberOf hs.vgi-draw
             * (PRIVATE) Deselect currently selected feature, feauture stays inactive until it is selected again.
             */
            function deselectCurrentFeature() {
                if (angular.isObject($scope.current_feature)) {
                    utils.insertAfter(document.querySelector('.hs-dr-editpanel'), document.getElementsByClassName('hs-dr-featurelist')[0]);
                    if (angular.isUndefined($scope.current_feature)) return;
                    $scope.current_feature.ol_feature.setStyle(undefined);
                    drawService.selectedFeatures.clear();
                }
                $scope.current_feature = null;
            }

            /**
             * @function setFeatureStyle
             * @memberOf hs.vgi-draw
             * @param {Ol.style.style} new_style
             * DEPRACATED? vector undefined
             */
            $scope.setFeatureStyle = function (new_style) {
                style = new_style;
                vector.setStyle(new_style);
            }

            $scope.$watch('drawService.type', function () {
                if (layoutService.mainpanel != 'draw') return;
                drawService.deactivateDrawing();
                activateDrawing();
            });

            $scope.$on('core.mainpanel_changed', function (event) {
                if (layoutService.mainpanel == 'draw') {
                    fillDrawableLayersList();
                    if ($scope.drawable_layers.length == 1) {
                        $scope.selected_layer = $scope.drawable_layers[0].get('title');
                        $scope.changeLayer();
                    } else if ($scope.drawable_layers.length > 1) {
                        activateDrawing();
                    }
                } else {
                    drawService.deactivateDrawing();
                }
            });

            function activateDrawing() {
                drawService.activateDrawing(
                    $scope.onDrawStart,
                    $scope.onDrawEnd,
                    $scope.onFeatureSelected,
                    $scope.onFeatureDeselected
                );
            }

            /**
             * @function fillDrawableLayersList
             * @memberOf hs.vgi-draw
             * (PRIVATE) Finds all layers in app which are drawable
             */
            function fillDrawableLayersList() {
                $scope.drawable_layers = [];
                angular.forEach(map.getLayers(), function (layer) {
                    if (utils.instOf(layer, VectorLayer) && layer.getVisible() && (angular.isUndefined(layer.get('show_in_manager')) || layer.get('show_in_manager') == true) && (angular.isDefined(layer.get('title')) && layer.get('title') != '')) {
                        $scope.drawable_layers.push(layer);
                        if (layer == $scope.layer_to_select) {
                            $scope.selected_layer = layer.get('title');
                            drawService.source = layer.getSource();
                            // fillFeatureList();
                        }
                    }
                })
            }

            /**
             * @function getCurrentTimestamp
             * @memberOf hs.vgi-draw
             * (PRIVATE) Get current timestamp
             */
            function getCurrentTimestamp() {
                var d = new Date();
                return d.toISOString();
            }

            /**
             * @function sync
             * @memberOf hs.vgi-draw
             * Sync created points with Senslog server
             */
            $scope.sync = function () {
                angular.forEach($scope.features, function (feature) {
                    var olf = feature.ol_feature;
                    var attributes = {};
                    angular.forEach(olf.getKeys(), function (key) {
                        if (attrs_not_editable.indexOf(key) == -1 && attrs_dont_send.indexOf(key) == -1 && key != 'category_id' && key != 'description' && key != 'dataset_id') {
                            attributes[key] = olf.get(key);
                        }
                    });
                    var cord = transform(olf.getGeometry().getCoordinates(), OlMap.map.getView().getProjection(), 'EPSG:4326');

                    var fd = new FormData();
                    fd.append('time_stamp', getCurrentTimestamp());
                    fd.append('category_id', olf.get('category_id') /*|| 0*/);
                    if (olf.get('description')) fd.append('description', olf.get('description'));
                    fd.append('lon', cord[0].toFixed(2)); // MEDIATODO: restrict to n decimal places
                    fd.append('lat', cord[1].toFixed(2));
                    fd.append('dataset_id', olf.get('dataset_id') || 999);
                    if (config.uuid) fd.append('uuid', config.uuid);
                    if (config.unit_id) fd.append('unit_id', config.unit_id);
                    var media = olf.get('media');

                    if (!angular.equals(attributes, {})) fd.append('attributes', JSON.stringify(attributes));
                    if (angular.isDefined(olf.get('sync_pending')) && olf.get('sync_pending') && angular.isDefined(olf.get('obs_vgi_id'))) {
                        fd.append('obs_vgi_id', olf.get('obs_vgi_id'));
                    }

                    function insertVgiObservation(olf, fd) {
                        $http.post($scope.senslog_url + '/observation?user_name=' + config.user_name, fd, {
                            transformRequest: angular.identity,
                            headers: {
                                'Content-Type': undefined
                            },
                            olf: olf
                        }).then(function (response) {
                            if (response.statusText == "OK") {
                                var olf = response.config.olf;
                                olf.set('sync_pending', false);
                                if (angular.isUndefined(olf.get('obs_vgi_id'))) olf.set('obs_vgi_id', parseInt(response.data.obs_vgi_id));
                                if (angular.isDefined(olf.get('temp_obs_id'))) olf.unset('temp_obs_id');
                                sendVgiMedia(olf, media);
                            }
                        });
                    }
                    function updateVgiObservation(olf, fd) {
                        $http.put($scope.senslog_url + '/observation/' + olf.get('obs_vgi_id') + '?user_name=' + config.user_name, fd, {
                            transformRequest: angular.identity,
                            headers: {
                                'Content-Type': undefined
                            },
                            olf: olf
                        }).then(function (response) {
                            if (response.statusText == "OK") {
                                var olf = response.config.olf;
                                olf.set('sync_pending', false);
                            }
                        });
                    }

                    function sendVgiMedia(olf, media) {
                        angular.forEach(media, function (m) {
                            if (!m.synced) {
                                var data = new FormData();
                                window.resolveLocalFileSystemURL(m.url, function (fileEntry) {
                                    fileEntry.file(function (file) {
                                        var reader = new FileReader();
                                        reader.onloadend = function () {
                                            image = new Blob([this.result], {
                                                type: m.image_type
                                            });
                                            data.append("media", image);
                                            data.append("media_type", m.image_type);

                                            $http.post($scope.senslog_url + '/observation/' + olf.get('obs_vgi_id') + '/media/?user_name=' + config.user_name, data, {
                                                transformRequest: angular.identity,
                                                headers: {
                                                    'Content-Type': undefined
                                                },
                                                olf: olf
                                            }).then(function (response) {
                                                if (response.statusText == "OK") {
                                                    // update mediaId of the media and move it to synced filesystem location
                                                    m.media_id = response.data.media_id;
                                                    var obsId = olf.get("obs_vgi_id");
                                                    var portalFolder = config.hostname.default.url.split("/").slice(-1)[0];
                                                    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSys) {
                                                        fileSys.root.getDirectory(portalFolder + "/media/", {
                                                            create: false,
                                                            exclusive: false
                                                        }, function (mediaDir) {
                                                            mediaDir.getDirectory(String(obsId), {
                                                                create: true,
                                                                exclusive: false
                                                            }, function (obsDir) {
                                                                window.resolveLocalFileSystemURL(m.url, function (fileEntry) {
                                                                    fileEntry.moveTo(obsDir, m.media_id + ".jpg", function (entry) {
                                                                        m.synced = true;
                                                                        m.url = entry.nativeURL;
                                                                        $scope.$apply();
                                                                    }, function (err) {
                                                                        console.log(err);
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                }
                                            });
                                        }
                                        reader.readAsArrayBuffer(file);
                                    });
                                });
                            }
                        });
                    }

                    if (angular.isUndefined(olf.get('obs_vgi_id')) && (angular.isDefined(olf.get('sync_pending')) && olf.get('sync_pending'))) {
                        insertVgiObservation(olf, fd);
                    } else if (angular.isDefined(olf.get('obs_vgi_id')) && (angular.isDefined(olf.get('sync_pending')) && olf.get('sync_pending'))) {
                        updateVgiObservation(olf, fd);
                        sendVgiMedia(olf, media);
                    }
                })
            }

            $scope.onDrawStart = function (evt) {
                evt.feature.setId(utils.generateUuid());
                var featureContainer = {
                    type: drawService.type,
                    uuid: evt.feature.getId(),
                    ol_feature: evt.feature,
                    time_stamp: getCurrentTimestamp(),
                    dataset_id: drawService.source.get('dataset_id')
                }
                if ($scope.categories && $scope.categories.length > 0) {
                    featureContainer.category_id = $scope.categories[0].category_id;
                }
                $scope.features.push(featureContainer);
                $timeout(function () {
                    $scope.setCurrentFeature($scope.features[$scope.features.length - 1], false);
                })
            }

            $scope.onDrawEnd = function (evt) {
                $scope.$emit('feature_drawn', {
                    layer: $scope.selected_layer,
                    features: saveMap.serializeFeatures([evt.feature])
                });
            }

            $scope.onFeatureSelected = function (e) {
                angular.forEach($scope.features, function (container_feature) {
                    if (container_feature.ol_feature == e.element) {
                        $scope.saveFeature();
                        deselectCurrentFeature();
                        $scope.setCurrentFeature(container_feature, false);
                    }
                })
            }

            $scope.onDeatureDeselected = function (e) {
                deselectCurrentFeature();
            }

            /**
             * @function setLayerToSelect
             * @memberOf hs.vgi-draw
             * @params {} layer 
             *
             */
            $scope.setLayerToSelect = function (layer) {
                $scope.layer_to_select = layer;
            }

            var el = angular.element('<span hs.vgi-layer-manager-button></span>');
            document.querySelector('.hs-lm-map-content-header').appendChild(el[0]);
            $compile(el)($scope);

            /**
             * @function addDrawingLayer
             * @memberOf hs.layermanager.controller
             * @description Create new vector layer for drawing features by user 
             */
            $scope.addDrawingLayer = function () {
                var source = new Vector();
                source.styleAble = true;
                source.hasPoint = true;
                source.hasPolygon = true;
                source.hasLine = true;
                var layer = new VectorLayer({
                    title: 'New user graphics layer',
                    visibility: true,
                    source: source
                })
                map.getLayers().push(layer);
                $scope.$emit('layer_added', {
                    layer: saveMap.layer2json(layer)
                });
                $scope.setLayerToSelect(layer);
                layoutService.setMainPanel('draw', false);
            }

            $scope.$on('senslog.categories_loaded', function (event, categories) {
                $scope.categories = categories;
            })

            $scope.$on('senslog.datasets_loaded', function (event, datasets) {
                $scope.datasets = datasets;
            })

            $scope.$on('senslog.dataset_added', function (event, dataset) {
                $scope.datasets.push(dataset);
            })

            $scope.sync();

            $scope.$emit('scope_loaded', "Draw");
        }
    ]
}