define(['angular', 'ol', 'map'],

    function(angular, ol) {
        angular.module('hs.datasource_selector', ['hs.map'])
            .directive('datasourceSelector', function() {
                return {
                    templateUrl: hsl_path + 'components/datasource_selector/partials/datasource_selector.html'
                };
            })

        .controller('DatasourceSelector', ['$scope', 'OlMap',
            function($scope, OlMap) {
                var map = OlMap.map;
                $scope.datasets = [{
                    title: "Datatank",
                    url: "http://ewi.mmlab.be/otn/api/info",
                    type: "datatank",
                    layers: [],
                    lodaded: false
                }];
                for (var ds in $scope.datasets) {
                    var url = window.escape($scope.datasets[ds].url);
                    $.ajax({
                        url: "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + url,
                        cache: false,
                        dataType: "json",
                        success: function(j) {
                            for (var lyr in j) {
                                if (j[lyr].keywords.indexOf("kml") > -1) {
                                    var obj = j[lyr];
                                    obj.path = lyr;
                                    $scope.datasets[ds].layers.push(obj);
                                }
                            }
                        }
                    });
                }
                $scope.addToMap = function(ds, layer) {
                    if (ds.type == "datatank") {
                        if (layer.type == "shp") {
                            var lyr = new ol.layer.Vector({
                                title: layer.title || layer.description,
                                source: new ol.source.KML({
                                    url: ds.url + '/../../' + layer.path + '.kml',
                                    projection: ol.proj.get('EPSG:3857'),
                                    extractStyles: false                                    
                                }),
                                style: new ol.style.Style({
                                    image: new ol.style.Icon({
                                        src: ds.url + '/../../js/images/marker-icon.png'
                                    }),
                                    fill: new ol.style.Fill({
                                        color: "rgba(139, 189, 214, 0.3)",
                                    }),
                                    stroke: new ol.style.Stroke({
                                        color: '#112211',
                                        width: 1
                                    })
                                })
                            });
                            OlMap.map.addLayer(lyr);
                        }
                    }
                }
            }
        ]);

    });
