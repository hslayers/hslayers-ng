define(['angular', 'ol', 'SparqlJson', 'WfsSource', 'styles'],

    function(angular, ol, SparqlJson, WfsSource) {
        angular.module('hs.ows.nonwms', [])

        .service('hs.ows.nonwms.service', ['config', '$rootScope', 'hs.map.service', 'hs.styles.service', 'hs.utils.service', '$http',
            function(config, $rootScope, OlMap, styles, utils, $http) {
                me = this;

                me.add = function(type, url, title, abstract, extract_styles, srs, options) {
                    var format;
                    var definition = {};
                    var src;
                    definition.url = url;
                    if (angular.isUndefined(options)) {
                        var options = {};
                    }

                    if (type.toLowerCase() != 'sparql') {
                        url = utils.proxify(url);
                    }

                    switch (type.toLowerCase()) {
                        case "kml":
                            format = new ol.format.KML({
                                extractStyles: extract_styles
                            });
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
                        src = new SparqlJson({
                            geom_attribute: '?geom',
                            url: url,
                            category_field: 'http://www.openvoc.eu/poi#categoryWaze',
                            projection: 'EPSG:3857',
                            minResolution: 1,
                            maxResolution: 38
                                //feature_loaded: function(feature){feature.set('hstemplate', 'hs.geosparql_directive')}
                        });
                    } else if (definition.format == 'hs.format.WFS') {
                        src = new WfsSource(options.defOptions);
                    } else if (angular.isDefined(options.features)) {
                        src = new ol.source.Vector({
                            projection: srs,
                            features: options.features
                        });

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

                        OlMap.map.getView().fit(src.getExtent(), OlMap.map.getSize());

                    } else {
                        src = new ol.source.Vector({
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
                                        this.set('loaded', true);



                                    },
                                    error: function(xhr, ajaxOptions, thrownError) {
                                        this.error = true;
                                        this.errorMessage = xhr.status;
                                        this.set('loaded', true);
                                    }
                                });
                            },
                            strategy: ol.loadingstrategy.all
                        });

                    }
                    src.set('loaded', true);
                    src.set('from_composition', options.from_composition || false);
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
                        if (src.getState() == 'ready' && (angular.isUndefined(src.get('from_composition')) || !src.get('from_composition'))) {
                            if (src.getFeatures().length == 0) return;
                            var extent = src.getExtent(); - src.unByKey(listenerKey);
                            if (!isNaN(extent[0]) && !isNaN(extent[1]) && !isNaN(extent[2]) && !isNaN(extent[3]))
                                OlMap.map.getView().fit(extent, OlMap.map.getSize());
                        }
                    });

                    if (options.from_composition != true) {
                        OlMap.map.addLayer(lyr);
                    }
                    return lyr;
                };

                var dragAndDrop = new ol.interaction.DragAndDrop({
                    formatConstructors: [
                        ol.format.GPX,
                        ol.format.GeoJSON,
                        ol.format.IGC,
                        ol.format.KML,
                        ol.format.TopoJSON
                    ]
                });

                OlMap.map.addInteraction(dragAndDrop);
                dragAndDrop.on('addfeatures', function(event) {
                    var f = new ol.format.GeoJSON();
                    var url = (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + (config.status_manager_url || "/wwwlibs/statusmanager2/index.php");
                    console.info(url, config.status_manager_url, config.hostname.user.url, config.hostname.status_manager.url, config.hostname.default.url);
                    var options = {};
                    options.features = event.features;

                    $http({
                        url: url,
                        method: 'POST',
                        data: JSON.stringify({
                            project: config.project_name,
                            title: event.file.name,
                            request: 'saveData',
                            dataType: "json",
                            data: f.writeFeatures(event.features, {
                                dataProjection: 'EPSG:4326',
                                featureProjection: OlMap.map.getView().getProjection().getCode()
                            })
                        })
                    }).success(function(j) {
                        data = {};
                        data.url = url + "?request=loadData&id=" + j.id;
                        console.info(data.url, j);
                        data.title = event.file.name;
                        data.projection = event.projection;
                        var lyr = me.add('geojson', decodeURIComponent(data.url), data.title || 'Layer', '', true, data.projection, options);
                    }).error(function(e) {
                        console.log(e);
                    });
                });
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
