define(['angular', 'ol', 'map'],

    function(angular, ol) {
        var module = angular.module('hs.compositions', ['hs.map', 'hs.core'])
            .directive('compositionBrowser', function() {
                return {
                    templateUrl: hsl_path + 'components/compositions/partials/compositions.html',
                    link: function(scope, element) {

                    }
                };
            })
            .service('composition_parser', ['OlMap', function(OlMap) {
                var me = {
                    load: function(url) {
                        url = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + window.escape(url);
                        $.ajax({
                                url: url
                            })
                            .done(function(response) {
                                var layers = me.getLayerDefinitions(response);
                                for (var i = 0; i < layers.length; i++) {
                                    OlMap.map.addLayer(layers[i]);
                                }
                            })
                    },
                    getLayerDefinitions: function(j) {
                        var layers = [];
                        for (var i = 0; i < j.layers.length; i++) {
                            var lyr_def = j.layers[i];
                            switch (lyr_def.className) {
                                case "HSLayers.Layer.WMS":
                                    var source_class = lyr_def.singleTile ? ol.source.ImageWMS : ol.source.TileWMS;
                                    var layer_class = lyr_def.singleTile ? ol.layer.Image : ol.layer.Tile;
                                    var new_layer = new layer_class({
                                        title: lyr_def.title,
                                        maxResolution: lyr_def.maxResolution,
                                        minResolution: lyr_def.minResolution,
                                        minScale: lyr_def.minScale,
                                        maxScale: lyr_def.maxScale,
                                        show_in_manager: lyr_def.displayInLayerSwitcher,
                                        abstract: lyr_def.name,
                                        metadata: lyr_def.metadata,
                                        source: new source_class({
                                            url: lyr_def.url,
                                            attributions: lyr_def.attribution ? [new ol.Attribution({
                                                html: '<a href="' + lyr_def.attribution.OnlineResource + '">' + lyr_def.attribution.Title + '</a>'
                                            })] : undefined,
                                            styles: lyr_def.metadata.styles,
                                            params: lyr_def.params,
                                            crossOrigin: 'anonymous',
                                            projection: lyr_def.projection,
                                            ratio: lyr_def.ratio,
                                            crossOrigin: null
                                        })
                                    });
                                    layers.push(new_layer);
                                    break;
                            }

                        }
                        return layers;
                    }
                };
                return me;
            }])
            .controller('Compositions', ['$scope', 'OlMap', 'Core', 'composition_parser',
                function($scope, OlMap, Core, composition_parser) {
                    $scope.$emit('scope_loaded', "Compositions");
                }
            ]);

    })
