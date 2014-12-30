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

        .service('Geolocation', ['OlMap', '$rootScope',
            function(OlMap, $rootScope) {
                var me = {
                    geolocation: null,
                    toggleFeatures: function(visible) {
                        if (visible) {
                            featuresOverlay.addFeature(accuracyFeature);
                            featuresOverlay.addFeature(positionFeature);
                        } else {
                            featuresOverlay.removeFeature(accuracyFeature);
                            featuresOverlay.removeFeature(positionFeature);

                        }
                    }
                };
                me.geolocation = new ol.Geolocation({
                    projection: OlMap.map.getView().getProjection()
                });
                //var track = new ol.dom.Input(document.getElementById('track'));
                //track.bindTo('checked', geolocation, 'tracking');

                me.geolocation.on('change', function() {
                    if (!me.geolocation.getTracking()) return;
                   
                    me.accuracy = me.geolocation.getAccuracy() ? me.geolocation.getAccuracy() + ' [m]' : '';
                    me.altitude = me.geolocation.getAltitude() ? me.geolocation.getAltitude() + ' [m]' : '-';
                    me.altitudeAccuracy = me.geolocation.getAltitudeAccuracy() ? '+/- ' + me.geolocation.getAltitudeAccuracy() + ' [m]' : '';
                    me.heading = me.geolocation.getHeading() ? me.geolocation.getHeading() : null;
                    me.speed = me.geolocation.getSpeed() ? me.geolocation.getSpeed() + ' [m/s]' : '-';
                    if(me.geolocation.getPosition()){
                        var p = me.geolocation.getPosition();
                        if (!positionFeature.getGeometry())
                            positionFeature.setGeometry(new ol.geom.Point(p));
                        else
                            positionFeature.getGeometry().setCoordinates(p);
                        OlMap.map.getView().setCenter(p);
                    }
                    if(me.heading) OlMap.map.getView().setRotation(me.heading);
                    $rootScope.$broadcast('geolocation.updated');
                });

                // handle geolocation error.
                me.geolocation.on('error', function(error) {
                    var info = document.getElementById('info');
                    info.innerHTML = error.message;
                    info.style.display = '';
                });

                var style = new ol.style.Style({
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

                var accuracyFeature = new ol.Feature();
                accuracyFeature.bindTo('geometry', me.geolocation, 'accuracyGeometry');

                var positionFeature = new ol.Feature();

                accuracyFeature.setStyle(style);
                positionFeature.setStyle(style);


                var featuresOverlay = new ol.FeatureOverlay({
                    map: OlMap.map,
                    features: []
                });


                return me;
            }
        ]).controller('Geolocation', ['$scope', 'Geolocation', function($scope, Geolocation) {
            $scope.$on('geolocation.updated', function(event) {
                $scope.speed = Geolocation.speed;
                $scope.alt = Geolocation.altitude;
                $scope.altitudeAccuracy = Geolocation.altitudeAccuracy;
                if (!$scope.$$phase) $scope.$digest();
            });
        }]);
    })
