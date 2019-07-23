import { Style, Icon, Stroke, Fill, Circle } from 'ol/style';
import Feature from 'ol/Feature';
import Geolocation from 'ol/Geolocation';
import VectorLayer from 'ol/layer/Vector';
import { Vector } from 'ol/source';
import { transform } from 'ol/proj';
import { Polygon, LineString, GeometryType, Point, Circle as CircleGeom } from 'ol/geom';

/**
 * @namespace hs.geolocation
 * @memberOf hs
 */
angular.module('hs.geolocation', ['hs.map'])
    /**
    * @memberof hs.geolocation
    * @ngdoc directive
    * @name hs.geolocation.directive
    * @description Add geolocation tracking panel html template to map, add event listeners through link
    */
    .directive('hs.geolocation.directive', ['hs.map.service', 'hs.geolocation.service', 'Core', 'config', function (OlMap, Geolocation, Core, config) {
        return {
            template: Core.isMobile() ? require('components/geolocation/partials/geolocation_cordova.html') : require('components/geolocation/partials/geolocation.html'),
            link: function link(scope, element, attrs) {
                if (!Core.puremapApp) {
                    if (Core.isMobile()) {
                        document.querySelector("#menu").appendChild(element[0]);
                    } else {
                        document.querySelector(".ol-overlaycontainer-stopevent").appendChild(element[0]);
                    }
                }
            },
            controller: ['$scope', function ($scope) {
                $scope.collapsed = true;
                $scope.blocateClick = function (e) {
                    //Checking target is needed because follow button is inside locate button (container) 
                    //and because of that follow button triggers click on parent element
                    if (!e.target.classList.contains('locateToggler')) return;
                    $scope.collapsed = !$scope.collapsed;
                    Geolocation.toggleFeatures(!$scope.collapsed);
                    if (Core.isMobile()) {
                        Geolocation.toggleGps();
                    } else {
                        Geolocation.geolocation.setTracking(true);
                    }
                }
            }],
            replace: true
        };
    }])

    /**
    * @memberof hs.geolocation
    * @ngdoc service
    * @name hs.geolocation.service
    * @description Contains geolocation services, for mobile version through navigator.geolocation API, for classic version through OpenLayers ol.Geolocation class
    */
    .service('hs.geolocation.service', ['hs.map.service', '$rootScope', '$log', 'Core',
        function (OlMap, $rootScope, $log, Core) {
            var me = {
                following: false,
                geolocation: null,
                /**
                * Set visibility of position layer on the map
                * @memberof hs.geolocation.service
                * @function toggleFeatures
                * @param {Boolean} visible Visibility of position layer (true/false)
                */
                toggleFeatures: function (visible) {
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


            var accuracyFeature = new Feature({ known: false, geometry: new CircleGeom([0, 0], 1) });
            var positionFeature = new Feature({ known: false, geometry: new Point([0, 0]) });

            $rootScope.$on('map.loaded', function () {
                init();
            });

            function init() {
                if (Core.isMobile()) {
                    /**
                    * (Only for Mobile) Center map on last location
                    * @memberof hs.geolocation.service
                    * @function setCenter
                    */
                    me.setCenter = function () {
                        OlMap.map.getView().setCenter(me.last_location.latlng);
                    };

                    me.geolocation = navigator.geolocation;

                    /**
                    * (Only for Mobile) Toggle (Start/Stop) GPS tracking, set display of position layer accordingly 
                    * @memberof hs.geolocation.service
                    * @function toggleGps
                    */
                    me.toggleGps = function () {
                        if (me.gpsStatus) {
                            me.stopGpsWatch();
                        } else {
                            me.startGpsWatch();
                        }
                        me.toggleFeatures(me.gpsStatus);
                        $rootScope.$broadcast('geolocation.switched');
                    };

                    /**
                    * (Only for Mobile) Start GPS tracking if possible, initialize Ol.geolocation handler
                    * @memberof hs.geolocation.service
                    * @function startGpsWatch
                    */
                    me.startGpsWatch = function () {
                        if (navigator.geolocation) {
                            me.gpsStatus = true;
                            // me.gpsSwitch = 'Stop GPS';
                            if (me.changed_handler != null)
                                me.geolocation.clearWatch(me.changed_handler);
                            me.changed_handler = me.geolocation.watchPosition(gpsOkCallback, gpsFailCallback, gpsOptions);
                            $rootScope.$broadcast('geolocation.started');
                        }
                    };

                    /**
                    * (Only for Mobile) Stop GPS tracking and clears handlers
                    * @memberof hs.geolocation.service
                    * @function stopGpsWatch
                    */
                    me.stopGpsWatch = function () {
                        me.gpsStatus = false;
                        // me.gpsSwitch = 'Start GPS';
                        me.geolocation.clearWatch(me.changed_handler);
                        me.changed_handler = null;
                        $rootScope.$broadcast('geolocation.stopped');
                    };

                    /**
                    * (PRIVATE) (Only for Mobile) Callback for handling successful location response, update location variables
                    * @memberof hs.geolocation.service
                    * @function gpsOkCallback
                    * @param {object} position Position object
                    */
                    var gpsOkCallback = function (position) {
                        me.accuracy = position.coords.accuracy ? Math.round(position.coords.accuracy) : '-';
                        me.altitude = position.coords.altitude ? Math.round(position.coords.altitude) : '-';
                        me.heading = position.coords.heading ? position.coords.heading : null;
                        me.speed = position.coords.speed ? Math.round(position.coords.speed * 3.6) : '-';
                        me.last_location = {
                            "latlng": transform([position.coords.longitude, position.coords.latitude], 'EPSG:4326', OlMap.map.getView().getProjection()),
                            altitude: position.coords.altitude,
                            "geoposition": position
                        }
                        // me.last_location.latlng = ol.proj.transform([position.coords.longitude, position.coords.latitude], 'EPSG:4326', OlMap.map.getView().getProjection());

                        positionFeature.set('known', true);
                        accuracyFeature.set('known', true);
                        positionFeature.getGeometry().setCoordinates(me.last_location.latlng);
                        accuracyFeature.getGeometry().setCenterAndRadius(me.last_location.latlng, me.accuracy);

                        if (me.following) {
                            me.setCenter();
                        }

                        lat = position.coords.latitude;
                        lon = position.coords.longitude;
                        if (typeof trackingDb != 'undefined') {
                            trackingDb.transaction(logPosition, errorCB, successCB);
                            db_id++;
                        }

                        $rootScope.$broadcast('geolocation.updated', me.last_location);
                    };

                    /**
                    * (PRIVATE) (Only for Mobile) Callback for handling geolocation error
                    * @memberof hs.geolocation.service
                    * @function gpsFailCallback
                    * @param {object} e Position fail object
                    */
                    var gpsFailCallback = function (e) {
                        var msg = 'Error ' + e.code + ': ' + e.message;
                        if (console) console.log(msg);
                        if (me.gpsStatus) {
                            if (e.message == 'Timeout expired') {
                                if (console) console.log('Removing the timeout setting');
                                gpsOptions.timeout = 10000;
                                if (me.changed_handler != null)
                                    me.geolocation.clearWatch(me.changed_handler);
                            }
                            setTimeout(function () {
                                me.changed_handler = me.geolocation.watchPosition(gpsOkCallback, gpsFailCallback, gpsOptions);
                                if (console) console.log('Try again..');
                            }, 5000);
                        }
                    };

                    var gpsOptions = {
                        enableHighAccuracy: true,
                        timeout: 5000, //10 secs
                        maximumAge: 100000
                    };
                } else {
                    me.geolocation = new Geolocation({
                        projection: OlMap.map.getView().getProjection()
                    });

                    /**
                    * (Only for Desktop) Change handler of ol.Geolocation object (for desktop use)
                    * @memberof hs.geolocation.service
                    * @function changed_handler
                    */
                    me.changed_handler = function () {
                        if (!me.geolocation.getTracking()) return;
                        me.accuracy = me.geolocation.getAccuracy() ? me.geolocation.getAccuracy() + ' [m]' : '';
                        me.altitude = me.geolocation.getAltitude() ? me.geolocation.getAltitude() + ' [m]' : '-';
                        me.altitudeAccuracy = me.geolocation.getAltitudeAccuracy() ? '+/- ' + me.geolocation.getAltitudeAccuracy() + ' [m]' : '';
                        me.heading = me.geolocation.getHeading() ? me.geolocation.getHeading() : null;
                        me.speed = me.geolocation.getSpeed() ? me.geolocation.getSpeed() + ' [m/s]' : '-';
                        me.last_location = {
                            "latlng": me.geolocation.getPosition(),
                            altitude: me.geolocation.getAltitude(),
                            "geoposition": me.geolocation
                        }
                        positionFeature.set('known', !!me.geolocation.getPosition());
                        accuracyFeature.set('known', !!me.geolocation.getAccuracy());
                        if (me.geolocation.getPosition()) {
                            var p = me.geolocation.getPosition();
                            $log.info(p);
                            positionFeature.getGeometry().setCoordinates(p);
                            accuracyFeature.getGeometry().setCenterAndRadius(p, me.geolocation.getAccuracy());
                            if (me.following)
                                OlMap.map.getView().setCenter(p);
                        }
                        if (me.heading) OlMap.map.getView().setRotation(me.heading);
                        $rootScope.$broadcast('geolocation.updated', me.last_location);
                    }

                    me.geolocation.on('change', me.changed_handler);

                    // handle geolocation error.
                    me.geolocation.on('error', function (error) {
                        var info = document.getElementById('info');
                        if (info) {
                            info.style.display = '';
                            info.innerHTML = error.message;
                        }
                        else {
                            console.error(error);
                        }
                    });
                    //var track = new ol.dom.Input(document.getElementById('track'));
                    //track.bindTo('checked', geolocation, 'tracking');
                }
            }

            me.style = new Style({
                image: new Circle({
                    fill: new Fill({
                        color: [242, 121, 0, 0.7]
                    }),
                    stroke: new Stroke({
                        color: [0xbb, 0x33, 0x33, 0.7]
                    }),
                    radius: 5
                }),
                fill: new Fill({
                    color: [0xbb, 0xbb, 0xbb, 0.2]
                }),
                stroke: new Stroke({
                    color: [0x66, 0x66, 0x00, 0.8]
                })
            });

            accuracyFeature.setStyle(me.style);
            positionFeature.setStyle(me.style);

            me.position_layer = new VectorLayer({
                title: "Position",
                show_in_manager: false,
                source: new Vector()
            });

            return me;
        }
    ])

    /**
    * @memberof hs.geolocation
    * @name hs.geolocation.controller
    * @ngdoc controller
    */
    .controller('hs.geolocation.controller', ['$scope', 'hs.geolocation.service', 'hs.map.service', 'Core', function ($scope, service, OlMap, Core) {
        $scope.speed = null;
        $scope.alt = null;
        $scope.altitudeAccuracy = null;
        $scope.accuracy = null;
        $scope.Geolocation = service;

        if (Core.isMobile()) {
            $scope.switchGps = service.toggleGps;

            /**
            * Tracking info/starter, without argument return tracking status. With argument start tracking for mobile, with argument "True" start tracking for desktop 
            * @memberof hs.geolocation.controller
            * @function gpsActive
            * @param {Boolean} set_to Optional argument
            */
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
            //Same as above, but for desktop version
            $scope.gpsActive = function (set_to) {
                if (arguments.length == 0)
                    return service.geolocation.getTracking();
                else {
                    service.geolocation.setTracking(set_to);
                }
            };
        }

        /**
        * Return which geolocation provider is currently used (Geolocation API / ol.Geolocation)
        * @memberof hs.geolocation.controller
        * @function getGeolocationProvider
        */
        $scope.getGeolocationProvider = function () {
            return service.geolocation;
        };

        /**
        * State manager of following function. Without arguments returns following state in Boolean. With argument change following state.
        * @memberof hs.geolocation.controller
        * @function following
        * @param {Boolean} set_to Optional - Desired following state
        */
        $scope.following = function (set_to) {
            if (arguments.length == 0)
                return service.following;
            else {
                service.following = set_to;
                if (console) console.log(service.last_location);
                if (angular.isDefined(service.last_location)) {
                    if (set_to) OlMap.map.getView().setCenter(service.last_location.latlng);
                    if (Core.isMobile()) service.changed_handler();
                } else {
                    if (console) console.log('last location not defined');
                }
            }
        };

        /**
        * Change style of location layer
        * @memberof hs.geolocation.controller
        * @function setFeatureStyle
        * @param {ol.style.Style} style New style of location layer 
        */
        $scope.setFeatureStyle = function (style) {
            return service.style = style;
        }

        $scope.$on('geolocation.updated', function (event) {
            $scope.speed = service.speed;
            $scope.alt = service.altitude;
            $scope.accuracy = service.accuracy;
            $scope.altitudeAccuracy = service.altitudeAccuracy;
            if (!$scope.$$phase) $scope.$digest();
        });

        $scope.$on('geolocation.switched', function (event) {
            service.gpsSwitch = service.gpsStatus ? 'Stop GPS' : 'Start GPS';
            if (!$scope.$$phase) $scope.$digest();
        });

        $scope.$emit('scope_loaded', "Geolocation");
    }]);
