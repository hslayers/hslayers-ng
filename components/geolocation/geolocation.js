define(['angular', 'ol'],

    function(angular, ol) {
        angular.module('hs.geolocation', ['hs.map'])
            .directive('geolocation', ['OlMap', 'Geolocation', function(OlMap, Geolocation) {
                return {
                    templateUrl: hsl_path + 'components/geolocation/partials/geolocation.html',
                    link: function link(scope, element, attrs) {
                        element.appendTo($(".ol-overlaycontainer-stopevent"));
                        $('.locate button').click(function() {
                            $('.locate').toggleClass('ol-collapsed');
                            Geolocation.geolocation.setTracking(!Geolocation.geolocation.getTracking());
                            Geolocation.toggleFeatures(Geolocation.geolocation.getTracking());
                        });
                    },
                    replace: true
                };
            }])

        .service('Geolocation', ['OlMap',
            function(OlMap) {
                var geolocation = new ol.Geolocation({
                    projection: OlMap.map.getView().getProjection()
                });
                //var track = new ol.dom.Input(document.getElementById('track'));
                //track.bindTo('checked', geolocation, 'tracking');

                geolocation.on('change', function() {
                    accuracy = geolocation.getAccuracy() + ' [m]';
                    altitude = geolocation.getAltitude() + ' [m]';
                    altitudeAccuracy = geolocation.getAltitudeAccuracy() + ' [m]';
                    heading = geolocation.getHeading() + ' [rad]';
                    speed = geolocation.getSpeed() + ' [m/s]';
                });

                // handle geolocation error.
                geolocation.on('error', function(error) {
                    var info = document.getElementById('info');
                    info.innerHTML = error.message;
                    info.style.display = '';
                });

                var accuracyFeature = new ol.Feature();
                accuracyFeature.bindTo('geometry', geolocation, 'accuracyGeometry');

                var positionFeature = new ol.Feature();
                positionFeature.bindTo('geometry', geolocation, 'position')
                    .transform(function() {}, function(coordinates) {
                        return coordinates ? new ol.geom.Point(coordinates) : null;
                    });

                var style = new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: [0xbb, 0xbb, 0xbb, 0.2]
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#3399FF'
                    })
                });

                var style2 = new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#3399FF'
                    })
                });

                var featuresOverlay = new ol.FeatureOverlay({
                    map: OlMap.map,
                    features: [],
                    style: style
                });

                OlMap.map.on("pointermove", function(event) {
                    var mouseCoordInMapPixels = [event.originalEvent.offsetX, event.originalEvent.offsetY];

                    //detect feature at mouse coords
                    var hit = OlMap.map.forEachFeatureAtPixel(mouseCoordInMapPixels, function(feature, layer) {
                        return (feature == accuracyFeature || feature == positionFeature);
                    });
                    if (hit) {
                        featuresOverlay.setStyle(style2)
                    } else {
                        featuresOverlay.setStyle(style);
                    }
                })

                return {
                    geolocation: geolocation,
                    toggleFeatures: function(visible) {
                        if (visible) {
                            featuresOverlay.addFeature(accuracyFeature);
                            featuresOverlay.addFeature(positionFeature);
                        } else {
                            featuresOverlay.removeFeature(accuracyFeature);
                            featuresOverlay.removeFeature(positionFeature);

                        }
                    }
                }
            }
        ]).run(function(Geolocation) { // instance-injector
            //Gets executed after service is loaded
        });
    })
