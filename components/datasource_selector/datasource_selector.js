define(['angular', 'ol', 'map'],

    function(angular, ol) {
        angular.module('hs.datasource_selector', ['hs.map'])
            .directive('datasourceSelector', function() {
                return {
                    templateUrl: hsl_path + 'components/datasource_selector/partials/datasource_selector.html'
                };
            })

        .controller('DatasourceSelector', ['$scope', 'OlMap', 'Core', 'OwsWmsCapabilities',
            function($scope, OlMap, Core, OwsWmsCapabilities) {
                var map = OlMap.map;
                var extent_layer = new ol.layer.Vector({
                    title: "Datasources extents",
                    show_in_manager: false,
                    source: new ol.source.Vector(),
                    style: function(feature, resolution) {
                        return [new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: '#005CB6',
                                width: feature.get('highlighted') ? 4 : 1
                            }),
                            fill: new ol.style.Fill({
                                color: 'rgba(0, 0, 255, 0.01)'
                            })
                        })]
                    }
                });
                var default_style = new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'http://ewi.mmlab.be/otn/api/info/../../js/images/marker-icon.png',
                        offset: [0, 16]
                    }),
                    fill: new ol.style.Fill({
                        color: "rgba(139, 189, 214, 0.3)",
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#112211',
                        width: 1
                    })
                })

                $scope.datasets = null;

                $scope.loadDatasets = function(datasets) {
                    $scope.datasets = datasets;
                    extent_layer.getSource().clear();
                    for (var ds in $scope.datasets) {
                        switch ($scope.datasets[ds].type) {
                            case "datatank":
                                var url = encodeURIComponent($scope.datasets[ds].url);
                                $.ajax({
                                    url: "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + url,
                                    cache: false,
                                    dataType: "json",
                                    ds: ds,
                                    success: function(j) {
                                        $scope.datasets[this.ds].layers = [];
                                        $scope.datasets[this.ds].loaded = true;
                                        for (var lyr in j) {
                                            if (j[lyr].keywords && j[lyr].keywords.indexOf("kml") > -1) {
                                                var obj = j[lyr];
                                                obj.path = lyr;
                                                $scope.datasets[this.ds].layers.push(obj);
                                            }
                                        }
                                        if (!$scope.$$phase) $scope.$digest();
                                    }
                                });
                                break;
                            case "micka":
                                var url = encodeURIComponent($scope.datasets[ds].url + '?request=GetRecords&format=application/json&language=' + $scope.datasets[ds].language + '&query=AnyText%20like%20%27*geol*%27%20and%20BBOX%3D%2712.156%2044.5%2027.098%2053.149%27');
                                $.ajax({
                                    url: "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + url,
                                    cache: false,
                                    dataType: "json",
                                    ds: ds,
                                    success: function(j) {
                                        $scope.datasets[this.ds].layers = [];
                                        $scope.datasets[this.ds].loaded = true;
                                        for (var lyr in j.records) {
                                            if (j.records[lyr]) {
                                                var obj = j.records[lyr];
                                                $scope.datasets[this.ds].layers.push(obj);
                                                addExtentFeature(obj);
                                            }
                                        }
                                        if (!$scope.$$phase) $scope.$digest();
                                    }
                                });
                                break;
                        }
                    }
                }
                
                var addExtentFeature = function(record){
                    var attributes = {
                        record: record,
                        hs_notqueryable: true,
                        highlighted: false
                    };
                    var b = record.bbox.split(" ");
                    var first_pair = [parseFloat(b[0]), parseFloat(b[1])]
                    var second_pair = [parseFloat(b[2]), parseFloat(b[3])];
                    first_pair = ol.proj.transform(first_pair, 'EPSG:4326', 'EPSG:3857');
                    second_pair = ol.proj.transform(second_pair, 'EPSG:4326', 'EPSG:3857');
                    if(isNaN(first_pair[0]) || isNaN(first_pair[1]) || isNaN(second_pair[0]) || isNaN(second_pair[1])) return;
                    var extent = [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
                    attributes.geometry = ol.geom.Polygon.fromExtent(extent);
                    console.log(first_pair, second_pair);
                    var new_feature = new ol.Feature(attributes);
                    record.feature = new_feature;
                    extent_layer.getSource().addFeatures([new_feature]);
                }
                
                OlMap.map.on('pointermove', function(evt) {
                    var features = extent_layer.getSource().getFeaturesAtCoordinate(evt.coordinate);
                    var something_done = false;
                    $(extent_layer.getSource().getFeatures()).each(function() {
                        if (this.get("record").highlighted) {
                            this.get("record").highlighted = false;
                            something_done = true;
                        }
                    });
                    if (features.length) {
                        $(features).each(function() {
                            if (!this.get("record").highlighted) {
                                this.get("record").highlighted = true;
                                something_done = true;
                            }
                        })
                    }
                    if (something_done && !$scope.$$phase) $scope.$digest();
                });
                                    
                $scope.setDefaultFeatureStyle = function(style) {
                    default_style = style;
                }

                $scope.addLayerToMap = function(ds, layer) {
                    if (ds.type == "datatank") {
                        if (layer.type == "shp") {
                            var src = new ol.source.KML({
                                url: ds.url + '/../../' + layer.path + '.kml',
                                projection: ol.proj.get('EPSG:3857'),
                                extractStyles: false
                            });
                            var lyr = new ol.layer.Vector({
                                title: layer.title || layer.description,
                                source: src,
                                style: default_style
                            });
                            var listenerKey = src.on('change', function() {
                                if (src.getState() == 'ready') {
                                    var extent = src.getExtent();
                                    src.unByKey(listenerKey);
                                    if (!isNaN(extent[0]) && !isNaN(extent[1]) && !isNaN(extent[2]) && !isNaN(extent[3]))
                                        OlMap.map.getView().fitExtent(extent, map.getSize());
                                }
                            });
                            OlMap.map.addLayer(lyr);

                        }
                    }
                    if (ds.type == "micka") {
                        if (layer.trida == 'service' && (layer.serviceType == 'WMS' || layer.serviceType == 'OGC:WMS')) {
                            Core.setMainPanel('ows');
                            hslayers_api.gui.Ows.setUrlAndConnect(layer.link);
                        }
                    }
                }
                
                $scope.highlightComposition = function(composition, state) {
                    if(typeof composition.feature !== 'undefined')
                        composition.feature.set('highlighted', state)
                }

                OlMap.map.addLayer(extent_layer);

                $scope.loadDatasets([{
                    title: "Datatank",
                    url: "http://ewi.mmlab.be/otn/api/info",
                    type: "datatank"
                }, {
                    title: "Micka",
                    url: "http://cat.ccss.cz/csw/",
                    language: 'eng',
                    type: "micka"
                }]);
                $scope.$emit('scope_loaded', "DatasourceSelector");
            }
        ]);

    });
