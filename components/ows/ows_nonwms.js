define(['angular', 'ol'],

    function(angular, ol) {
        angular.module('hs.ows.nonwms', [])
            .controller('hs.ows.nonwms.controller', ['$scope', 'hs.map.service',
                function($scope, OlMap) {
                    $scope.srs = 'EPSG:3857';
                    $scope.title = "";
                    $scope.extract_styles = false;

                    $scope.addKmlLayer = function(url) {
                        if (typeof use_proxy === 'undefined' || use_proxy === true) {
                            url = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + window.escape(url);
                        }
                        var src = new ol.source.KML({
                            projection: ol.proj.get($scope.srs),
                            url: url,
                            extractStyles: $scope.extract_styles
                        })
                        var lyr = new ol.layer.Vector({
                            title: $scope.title,
                            source: src
                        });
                        OlMap.map.addLayer(lyr);
                        src.on('change', function() {
                            //console.log(src.getFeatures());
                        })
                    }

                    $scope.addGeoJsonLayer = function(url) {
                        if (typeof use_proxy === 'undefined' || use_proxy === true) {
                            url = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + window.escape(url);
                        } else {
                            url = url;
                        }
                        var lyr = new ol.layer.Vector({
                            title: $scope.title,
                            source: new ol.source.GeoJson({
                                projection: ol.proj.get($scope.srs),
                                url: url
                            })
                        });
                        OlMap.map.addLayer(lyr);
                    }

                }
            ]);
    })
