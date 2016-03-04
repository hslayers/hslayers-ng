define(['angular', 'ol', 'SparqlJson', 'styles'],

    function(angular, ol, SparqlJson) {
        angular.module('hs.ows.nonwms', [])

        .service('hs.ows.nonwms.service', ['hs.map.service', 'hs.styles.service', 'hs.utils.service',
            function(OlMap, styles, utils) {
                me = this;

                me.add = function(type, url, title, abstract, extract_styles, srs) {
                    if (type.toLowerCase() != 'sparql') {
                        url = utils.proxify(url);
                    }

                    /*var proxied = window.XMLHttpRequest.prototype.open;
                    window.XMLHttpRequest.prototype.open = function() {
                        console.log( arguments );
                        if(arguments[1].indexOf('hsproxy.cgi')==-1)
                            arguments[1]= '/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=' + window.escape(arguments[1]);
                        return proxied.apply(this, [].slice.call(arguments));
                    };*/

                    var format;
                    var definition = {};
                    definition.url = url;

                    switch (type.toLowerCase()) {
                        case "kml":
                            format = new ol.format.KML();
                            definition.format = "ol.format.KML";
                            break;
                        case "geojson":
                            format = new ol.format.GeoJSON();
                            definition.format = "ol.format.GeoJSON";
                            break;
                        case "sparql":
                            definition.format = "hs.format.Sparql";
                            break;
                    }

                    if (type.toLowerCase() == 'sparql') {
                        var src = new SparqlJson({
                            geom_attribute: '?geom',
                            url: url,
                            category_field: 'http://www.openvoc.eu/poi#categoryWaze',
                            projection: 'EPSG:3857',
                            minResolution: 1,
                            maxResolution: 38
                                //feature_loaded: function(feature){feature.set('hstemplate', 'hs.geosparql_directive')}
                        });
                    } else {
                        var src = new ol.source.Vector({
                            format: format,
                            url: url,
                            projection: ol.proj.get(srs),
                            extractStyles: extract_styles,
                            loader: function(extent, resolution, projection) {
                                $.ajax({
                                    url: url,
                                    success: function(data) {
                                        if (data.type == 'GeometryCollection') {
                                            var temp = {
                                                type: "Feature",
                                                geometry: data
                                            };
                                            data = temp;
                                        }
                                        src.addFeatures(format.readFeatures(data, {
                                            dataProjection: 'EPSG:4326',
                                            featureProjection: srs
                                        }));

                                        src.hasLine = false;
                                        src.hasPoly = false;
                                        src.hasPoint = false;
                                        angular.forEach(src.getFeatures(), function(f) {
                                            if (f.getGeometry()) {
                                                switch (f.getGeometry().getType()) {
                                                    case 'LineString' || 'MultiLineString':
                                                        src.hasLine = true;
                                                        break;
                                                    case 'Polygon' || 'MultiPolygon':
                                                        src.hasPoly = true;
                                                        break;
                                                    case 'Point' || 'MultiPoint':
                                                        src.hasPoint = true;
                                                        break;
                                                }
                                            }
                                        })

                                        if (src.hasLine || src.hasPoly || src.hasPoint) {
                                            src.styleAble = true;
                                        }


                                    }
                                });
                            },
                            strategy: ol.loadingstrategy.all
                        });

                    }

                    var lyr = new ol.layer.Vector({
                        title: title,
                        abstract: abstract,
                        saveState: true,
                        definition: definition,
                        source: src
                    });


                    var listenerKey = src.on('change', function() {

                        if (src.getState() == 'ready') {

                            if (src.getFeatures().length == 0) return;
                            var extent = src.getExtent(); - src.unByKey(listenerKey);
                            if (!isNaN(extent[0]) && !isNaN(extent[1]) && !isNaN(extent[2]) && !isNaN(extent[3]))
                                OlMap.map.getView().fit(extent, OlMap.map.getSize());
                        }
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
                    service.add($scope.type, $scope.url, $scope.title, $scope.abstract, $scope.extract_styles, $scope.srs);
                    Core.setMainPanel('layermanager');
                }
            }
        ]);
    })
