/**
 * @namespace hs.geolocation
 * @memberOf hs
 */
define(['angular', 'ol'],

    function(angular, ol) {
        angular.module('hs.geolocation', ['hs.map'])
            .directive('hs.geolocation.directive', ['hs.map.service', 'hs.geolocation.service', 'Core', function(OlMap, Geolocation, Core) {
                return {
                    templateUrl: Core.isMobile() ? hsl_path + 'components/geolocation/partials/geolocation_cordova.html?bust=' + gitsha : hsl_path + 'components/geolocation/partials/geolocation.html?bust=' + gitsha,
                    link: function link(scope, element, attrs) {
                        if (Core.isMobile()) {
                            element.appendTo($("#menu"));
                            $('.blocate').click(function() {
                                $('.locate-mobile').toggleClass('ol-collapsed');
                                // Rewrite this, ugly implementation.
                                $('#toolbar').removeClass('show');
                                if (!Geolocation.gpsStatus && !$('.locate-mobile').hasClass('ol-collapsed')) {
                                    Geolocation.toggleGps();
                                    Geolocation.toggleFeatures(true);
                                }
                            });
                        } else {
                            element.appendTo($(".ol-overlaycontainer-stopevent"));
                            $('.locate .blocate').click(function() {
                                $('.locate').toggleClass('ol-collapsed');
                                Geolocation.geolocation.setTracking(true);
                                Geolocation.toggleFeatures(!$('.locate').hasClass('ol-collapsed'));
                            });
                        }
                    },
                    replace: true
                };
            }])

        .service('hs.geolocation.service', ['hs.map.service', '$rootScope', '$log', 'Core',
            function(OlMap, $rootScope, $log, Core) {
                var me = {
                    following: false,
                    geolocation: null,
                    toggleFeatures: function(visible) {
                        var src = me.position_layer.getSource();
                        if (visible) {
                            OlMap.map.addLayer(me.position_layer);
                            src.addFeature(accuracyFeature);
                            src.addFeature(positionFeature);
                            me.position_layer.setZIndex(99);
                        } else {
                            src.removeFeature(accuracyFeature);
                            src.removeFeature(positionFeature);
                            OlMap.map.removeLayer(me.position_layer);
                        }
                    }
                };

                var accuracyFeature = new ol.Feature();
                var positionFeature = new ol.Feature();

                if (Core.isMobile()) {
                    me.set_center = function () {
                        OlMap.map.getView().setCenter(me.last_location.latlng);
                    };

                    me.geolocation = navigator.geolocation;

                    me.toggleGps = function () {
                        if (me.gpsStatus) {
                            me.stopGpsWatch();
                        } else {
                            me.startGpsWatch();
                        }
                        me.toggleFeatures(me.gpsStatus);
                        $rootScope.$broadcast('geolocation.switched');
                    };


                    me.startGpsWatch = function () {
                        if (navigator.geolocation) {
                            me.gpsStatus = true;
                            // me.gpsSwitch = 'Stop GPS';
                            me.changed_handler = me.geolocation.watchPosition(gpsOkCallback, gpsFailCallback, gpsOptions);
                        }
                    };
                    
                    me.stopGpsWatch = function () {
                        me.gpsStatus = false;
                        // me.gpsSwitch = 'Start GPS';
                        me.geolocation.clearWatch(me.changed_handler);
                        me.changed_handler = null;
                    };

                    var gpsOkCallback = function (position) {
                        me.accuracy = position.coords.accuracy ? Math.round(position.coords.accuracy) : '-';
                        me.altitude = position.coords.altitude ? Math.round(position.coords.altitude) : '-';
                        me.heading = position.coords.heading ? position.coords.heading : null;
                        me.speed = position.coords.speed ? Math.round(position.coords.speed * 3.6) : '-';
                        me.last_location = {
                            "latlng": ol.proj.transform([position.coords.longitude, position.coords.latitude], 'EPSG:4326', OlMap.map.getView().getProjection()),
                            "geoposition": position
                        }
                        // me.last_location.latlng = ol.proj.transform([position.coords.longitude, position.coords.latitude], 'EPSG:4326', OlMap.map.getView().getProjection());
                        if (!positionFeature.setGeometry()) {
                            positionFeature.setGeometry(new ol.geom.Point(me.last_location.latlng));
                        } else {
                            positionFeature.getGeometry().setCoordinates(me.last_location.latlng);
                        }
                        
                        if (!accuracyFeature.setGeometry()) {
                            accuracyFeature.setGeometry(new ol.geom.Circle(me.last_location.latlng, position.coords.accuracy));
                        } else {
                           accuracyFeature.getGeometry().setCenterAndRadius(me.last_location.latlng, me.accuracy);
                        }

                        if (me.following) {
                            me.set_center();
                        }
                        
                        lat = position.coords.latitude;
                        lon = position.coords.longitude;
                        trackingDb.transaction(logPosition, errorCB, successCB);
                        db_id++;
                        
                        $rootScope.$broadcast('geolocation.updated');
                    };

                    var gpsFailCallback = function (e) {
                        var msg = 'Error ' + e.code + ': ' + e.message;
                        console.log(msg);
                    };

                    var gpsOptions = {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 100000
                    };
                } else {
                    me.geolocation = new ol.Geolocation({
                        projection: OlMap.map.getView().getProjection()
                    });

                    me.changed_handler = function() {
                        if (!me.geolocation.getTracking()) return;

                        me.accuracy = me.geolocation.getAccuracy() ? me.geolocation.getAccuracy() + ' [m]' : '';
                        me.altitude = me.geolocation.getAltitude() ? me.geolocation.getAltitude() + ' [m]' : '-';
                        me.altitudeAccuracy = me.geolocation.getAltitudeAccuracy() ? '+/- ' + me.geolocation.getAltitudeAccuracy() + ' [m]' : '';
                        me.heading = me.geolocation.getHeading() ? me.geolocation.getHeading() : null;
                        me.speed = me.geolocation.getSpeed() ? me.geolocation.getSpeed() + ' [m/s]' : '-';
                        me.last_location = {
                            "latlng": me.geolocation.getPosition(),
                            "geoposition": me.geolocation
                        }
                        console.log(me.last_location);
                        if (me.geolocation.getPosition()) {
                            var p = me.geolocation.getPosition();
                            $log.info(p);
                            if (!positionFeature.getGeometry())
                                positionFeature.setGeometry(new ol.geom.Point(p));
                            else
                                positionFeature.getGeometry().setCoordinates(p);
                            if (me.following)
                                OlMap.map.getView().setCenter(p);
                        }
                        if (me.heading) OlMap.map.getView().setRotation(me.heading);
                        $rootScope.$broadcast('geolocation.updated');
                    }

                    me.geolocation.on('change', me.changed_handler);

                    // handle geolocation error.
                    me.geolocation.on('error', function(error) {
                        var info = document.getElementById('info');
                        info.innerHTML = error.message;
                        info.style.display = '';
                    });
                    //var track = new ol.dom.Input(document.getElementById('track'));
                    //track.bindTo('checked', geolocation, 'tracking');

                    me.geolocation.on('change:accuracyGeometry', function() {
                        accuracyFeature.set('geometry', me.geolocation.accuracyGeometry);
                    });
                    //accuracyFeature.bindTo('geometry', me.geolocation, 'accuracyGeometry');
                }

                me.style = new ol.style.Style({
                    image: new ol.style.Circle({
                        fill: new ol.style.Fill({
                            color: [242, 121, 0, 0.7]
                        }),
                        stroke: new ol.style.Stroke({
                            color: [0xbb, 0x33, 0x33, 0.7]
                        }),
                        radius: 5
                    }),
                    fill: new ol.style.Fill({
                        color: [0xbb, 0xbb, 0xbb, 0.2]
                    }),
                    stroke: new ol.style.Stroke({
                        color: [0x66, 0x66, 0x00, 0.8]
                    })
                });

                accuracyFeature.setStyle(me.style);
                positionFeature.setStyle(me.style);

                me.position_layer = new ol.layer.Vector({
                    title: "Position",
                    show_in_manager: false,
                    source: new ol.source.Vector()
                });

                return me;
            }
        ]).controller('hs.geolocation.controller', ['$scope', 'hs.geolocation.service', 'hs.map.service', 'Core', function($scope, service, OlMap, Core) {
            $scope.speed = null;
            $scope.alt = null;
            $scope.altitudeAccuracy = null;
            $scope.accuracy = null;
            $scope.Geolocation = service;

            if (Core.isMobile()) {
                $scope.switchGps = service.toggleGps;

                $scope.gpsActive = function (set_to) {
                    if (arguments.length === 0) {
                        return service.gpsStatus;
                        console.log('arguments = 0');
                    } else {
                        service.startGpsWatch();
                        console.log('Starting GPS.');
                    }
                };
            } else {
                $scope.gpsActive = function(set_to) {
                    if (arguments.length == 0)
                        return service.geolocation.getTracking();
                    else {
                        service.geolocation.setTracking(set_to);
                    }
                };
            }

            $scope.getGeolocationProvider = function() {
                return service.geolocation;
            };

            $scope.following = function(set_to) {
                if (arguments.length == 0)
                    return service.following;
                else {
                    service.following = set_to;
                    console.log(service.last_location);
                    if (set_to) OlMap.map.getView().setCenter(service.last_location.latlng);
                    if (Core.isMobile()) service.changed_handler();
                }
            };

            $scope.setFeatureStyle = function(style) {
                return service.style = style;
            }

            $scope.$on('geolocation.updated', function(event) {
                $scope.speed = service.speed;
                $scope.alt = service.altitude;
                $scope.accuracy = service.accuracy;
                $scope.altitudeAccuracy = service.altitudeAccuracy;
                if (!$scope.$$phase) $scope.$digest();
            });

            $scope.$on('geolocation.switched', function (event) {
                service.gpsSwitch = service.gpsStatus ? 'Stop GPS' : 'Start GPS';
                if (!$scope.$$phase) {
                    $scope.$digest();
                }
            });

            $scope.$emit('scope_loaded', "Geolocation");
        }]);
    })
