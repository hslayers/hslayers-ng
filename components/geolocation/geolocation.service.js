import { Style, Icon, Stroke, Fill, Circle } from 'ol/style';
import Feature from 'ol/Feature';
import Geolocation from 'ol/Geolocation';
import VectorLayer from 'ol/layer/Vector';
import { Vector } from 'ol/source';
import { transform } from 'ol/proj';
import { Polygon, LineString, GeometryType, Point, Circle as CircleGeom } from 'ol/geom';
import GyroNorm from '../../lib/gyronorm_updated';
import FULLTILT from 'fulltilt';
import { toRadians } from 'ol/math';

export default ['hs.map.service', '$rootScope', '$log', 'Core',
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

        function init() {
            /**
               * (Only for Mobile) set map rotation based on the device rotation
               * @memberof hs.geolocation.service
               * @function setRotation
               */
            me.setRotation = function () {
                var args = {
                    orientationBase: GyroNorm.WORLD,		// ( Can be GyroNorm.GAME or GyroNorm.WORLD. gn.GAME returns orientation values with respect to the head direction of the device. gn.WORLD returns the orientation values with respect to the actual north direction of the world. )
                    decimalCount: 4,					// ( How many digits after the decimal point will there be in the return values )
                };
                var gn = new GyroNorm();
                gn.FULLTILT = FULLTILT;
                gn.init(args).then(function () {
                    gn.start(function (event) {
                        var z = toRadians(event.do.alpha);
                        OlMap.map.getView().setRotation(z);
                    });
                }).catch(function (e) {
                    console.log(e);
                });
            };

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
                    me.speed = me.geolocation.getSpeed() ? Math.round(me.geolocation.getSpeed()) + ' [m/s]' : '-';
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

        OlMap.loaded().then(init);

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
]