define(['angular', 'ol', 'SparqlJson', 'WfsSource', 'styles'],

    function(angular, ol, SparqlJson, WfsSource) {
        angular.module('hs.ows.nonwms', [])

        .service('hs.ows.nonwms.service', ['$rootScope', 'hs.map.service', 'hs.styles.service', 'hs.utils.service',
            function($rootScope, OlMap, styles, utils) {
                me = this;

                me.add = function(type, url, title, abstract, extract_styles, srs, options) {
                    var format;
                    var definition = {};
                    definition.url = url;
                    if (angular.isUndefined(options)) {
                        var options = {};
                    }

                    if (type.toLowerCase() != 'sparql') {
                        url = utils.proxify(url);
                    }

                    switch (type.toLowerCase()) {
                        case "kml":
                            format = new ol.format.KML();
                            definition.format = "ol.format.KML";
                            break;
                        case "geojson":
                            format = new ol.format.GeoJSON();
                            definition.format = "ol.format.GeoJSON";
                            break;
                        case "wfs":
                            definition.format = "hs.format.WFS";
                            break;
                        case "sparql":
                            definition.format = "hs.format.Sparql";
                            break;
                    }

                    if (definition.format == 'hs.format.Sparql') {
                        var src = new SparqlJson({
                            geom_attribute: '?geom',
                            url: url,
                            category_field: 'http://www.openvoc.eu/poi#categoryWaze',
                            projection: 'EPSG:3857',
                            minResolution: 1,
                            maxResolution: 38
                                //feature_loaded: function(feature){feature.set('hstemplate', 'hs.geosparql_directive')}
                        });
                    } else if (definition.format == 'hs.format.WFS') {
                        var src = new WfsSource(options.defOptions);
                    } else {
                        var src = new ol.source.Vector({
                            format: format,
                            url: url,
                            projection: ol.proj.get(srs),
                            extractStyles: extract_styles,
                            loader: function(extent, resolution, projection) {
                                this.set('loaded', false);
                                $.ajax({
                                    url: url,
                                    context: this,
                                    success: function(data) {
                                        if (data.type == 'GeometryCollection') {
                                            var temp = {
                                                type: "Feature",
                                                geometry: data
                                            };
                                            data = temp;
                                        }
                                        this.addFeatures(format.readFeatures(data, {
                                            dataProjection: srs,
                                            featureProjection: OlMap.map.getView().getProjection().getCode()
                                        }));

                                        this.hasLine = false;
                                        this.hasPoly = false;
                                        this.hasPoint = false;
                                        angular.forEach(this.getFeatures(), function(f) {
                                            if (f.getGeometry()) {
                                                switch (f.getGeometry().getType()) {
                                                    case 'LineString' || 'MultiLineString':
                                                        this.hasLine = true;
                                                        break;
                                                    case 'Polygon' || 'MultiPolygon':
                                                        this.hasPoly = true;
                                                        break;
                                                    case 'Point' || 'MultiPoint':
                                                        this.hasPoint = true;
                                                        break;
                                                }
                                            }
                                        })

                                        if (this.hasLine || this.hasPoly || this.hasPoint) {
                                            this.styleAble = true;
                                        }
                                        this.set('loaded', true);



                                    }
                                });
                            },
                            strategy: ol.loadingstrategy.all
                        });

                    }
                    src.set('loaded', true);
                    var lyr = new ol.layer.Vector({
                        abstract: abstract,
                        definition: definition,
                        from_composition: options.from_composition || false,
                        opacity: options.opacity || 1,
                        saveState: true,
                        source: src,
                        style: options.style,
                        title: title
                    });

                    var key = src.on('propertychange', function(event) {
                        if (event.key == 'loaded') {
                            if (event.oldValue == false) {
                                $rootScope.$broadcast('layermanager.layer_loaded', lyr)
                            } else {
                                $rootScope.$broadcast('layermanager.layer_loading', lyr)
                            }
                        };

                    })
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
