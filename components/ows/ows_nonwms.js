define(['angular', 'ol', 'styles'],

    function(angular, ol) {
        angular.module('hs.ows.nonwms', [])

        .service('hs.ows.nonwms.service', ['hs.map.service', 'hs.styles.service',
            function(OlMap, styles) {
                me = this;

                me.add = function(type, url, title, extract_styles, srs) {
                    //if (typeof use_proxy === 'undefined' || use_proxy === true)
                    //url = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + window.escape(url);


                    /*var proxied = window.XMLHttpRequest.prototype.open;
                    window.XMLHttpRequest.prototype.open = function() {
                        console.log( arguments );
                        if(arguments[1].indexOf('hsproxy.cgi')==-1)
                            arguments[1]= '/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=' + window.escape(arguments[1]);
                        return proxied.apply(this, [].slice.call(arguments));
                    };*/

                    var format;
                    switch (type.toLowerCase()) {
                        case "kml":
                            format = new ol.format.KML();
                            break;
                        case "geojson":
                            format = new ol.format.GeoJSON();
                            break;
                    }

                    var src = new ol.source.ServerVector({
                        format: format,
                        projection: ol.proj.get(srs),
                        extractStyles: extract_styles,
                        loader: function(extent, resolution, projection) {
                            $.ajax({
                                url: url,
                                success: function(data) {
                                    src.addFeatures(src.readFeatures(data));
                                }
                            });
                        },
                        strategy: ol.loadingstrategy.all
                    });

                    var lyr = new ol.layer.Vector({
                        title: title,
                        source: src
                    });

                    OlMap.map.addLayer(lyr);
                    return lyr;
                }
            }
        ])

        .controller('hs.ows.nonwms.controller', ['$scope', 'hs.map.service', 'hs.styles.service', 'hs.ows.nonwms.service', 'Core',
            function($scope, OlMap, styles, service, Core) {
                $scope.srs = 'EPSG:3857';
                $scope.title = "";
                $scope.extract_styles = false;

                $scope.add = function() {
                    service.add($scope.type, $scope.url, $scope.title, $scope.extract_styles, $scope.srs);
                    Core.setMainPanel('layermanager');
                }
            }
        ]);
    })
