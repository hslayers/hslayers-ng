define(['ol', 'sparql_helpers'],

    function(ol, sparql_helpers) {
        var src = new ol.source.Vector();
        var $scope;
        var $compile;
        var map;
        var utils;
        var lyr;

        var selected_entity;

        function entityClicked(entity) {
            if (selected_entity) selected_entity.polygon.material.color = entity.original_color;
            selected_entity = entity;
            entity.polygon.material.color = new Cesium.Color.fromCssColorString('rgba(250, 250, 250, 0.6)');
        }

        src.cesiumStyler = function(dataSource) {
            var entities = dataSource.entities.values;
            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i];
                if (entity.styled) continue;
                entity.polygon.outline = false;
                entity.original_color = new Cesium.Color.fromCssColorString('rgba(40, 150, 40, 0.6)');
                entity.polygon.material = new Cesium.ColorMaterialProperty(entity.original_color);
                entity.styled = true;
                entity.onmouseup = entityClicked
            }
        }

        var me = {
            getForId: function(map, utils) {
                if (lyr.getVisible() == false) return;
                var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent(`
                PREFIX geo: <http://www.opengis.net/ont/geosparql#>
                PREFIX geof: <http://www.opengis.net/def/function/geosparql/>
                PREFIX virtrdf:	<http://www.openlinksw.com/schemas/virtrdf#> 
                PREFIX poi: <http://www.openvoc.eu/poi#> 
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                PREFIX foodie-cz: <http://foodie-cloud.com/model/foodie-cz#>
                PREFIX foodie: <http://foodie-cloud.com/model/foodie#>
                PREFIX common: <http://portele.de/ont/inspire/baseInspire#>
                PREFIX prov: <http://www.w3.org/ns/prov#>
                PREFIX olu: <http://w3id.org/foodie/olu#>
                PREFIX af-inspire: <http://inspire.ec.europa.eu/schemas/af/3.0#>
                
                
                SELECT DISTINCT ?erosionZone ?erosion ?erosionCoord
                FROM <http://w3id.org/foodie/open/cz/Erosion_zones_WGS#>
                WHERE {
                  ?erosionZone a foodie-cz:ErosionZone ;
                     foodie-cz:erosion ?erosion ;
                     geo:hasGeometry ?erosionGeo .
                  ?erosionGeo ogcgs:asWKT ?erosionCoord .
                  FILTER(bif:st_intersects(?erosionCoord, ?coordPlot)) .
                  GRAPH ?graph1 {   
                     SELECT ?holding ?plot ?code ?shortId ?landUse ?coordPlot
                     FROM <http://w3id.org/foodie/open/cz/pLPIS_180616_WGS#>
                     WHERE{ 
                       ?holding a foodie:Holding ;
                          common:identifier ?identifier_ID_UZ ;
                          foodie-cz:inspireIdCodeSpace ?inspireIdCodeSpace ;
                          foodie-cz:inspireIdCodeVersion ?inspireIdCodeVersion ;
                          af-inspire:contains ?site .
                       FILTER(STRSTARTS(STR(?identifier_ID_UZ),"${$scope.iduz}") )
                       ?site foodie:containsPlot ?plot .
                       ?plot a foodie:Plot ;
                          foodie:code ?code ;
                          foodie-cz:shortId ?shortId ;
                          olu:specificLandUse ?landUse ;
                          geo:hasGeometry ?geoPlot .
                       ?geoPlot ogcgs:asWKT  ?coordPlot .  
                    }
                  }
                }
                           
                `) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';

                sparql_helpers.startLoading(src, $scope);
                $.ajax({
                        url: utils.proxify(q)
                    })
                    .done(function(response) {
                        sparql_helpers.fillFeatures(src, 'erosionCoord', response, 'erosionZone', {
                            erosionZone: 'erosionZone',
                            erosion: 'erosion'
                        }, map, $scope);
                        sparql_helpers.zoomToFetureExtent(src, me.cesium.viewer.camera, map);
                    })
            },
            getForCTVDPB: function(map, utils) {
                if (lyr.getVisible() == false) return;
                var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent(`
                PREFIX geo: <http://www.opengis.net/ont/geosparql#>
                PREFIX geof: <http://www.opengis.net/def/function/geosparql/>
                PREFIX virtrdf:	<http://www.openlinksw.com/schemas/virtrdf#> 
                PREFIX poi: <http://www.openvoc.eu/poi#> 
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                PREFIX foodie-cz: <http://foodie-cloud.com/model/foodie-cz#>
                PREFIX foodie: <http://foodie-cloud.com/model/foodie#>
                PREFIX common: <http://portele.de/ont/inspire/baseInspire#>
                PREFIX prov: <http://www.w3.org/ns/prov#>
                PREFIX olu: <http://w3id.org/foodie/olu#>
                PREFIX af-inspire: <http://inspire.ec.europa.eu/schemas/af/3.0#>

                SELECT DISTINCT ?erosionZone ?erosion ?erosionCoord
                FROM <http://w3id.org/foodie/open/cz/Erosion_zones_WGS#>
                WHERE {
                ?erosionZone a foodie-cz:ErosionZone ;
                    foodie-cz:erosion ?erosion ;
                    geo:hasGeometry ?erosionGeo .
                ?erosionGeo geo:asWKT ?erosionCoord .
                FILTER(bif:st_intersects(?erosionCoord, ?coordPlotFinal)) .
                {
                SELECT ?plot ?coordPlotFinal
                FROM <http://w3id.org/foodie/open/cz/pLPIS_180616_WGS#>
                WHERE {
                    ?plot a foodie:Plot ;
                        foodie:code ?input ;
                        geo:hasGeometry ?geoPlotFinal .
                    ?geoPlotFinal geo:asWKT  ?coordPlotFinal .
                    {
                        SELECT ?input
                        WHERE {
                            ?s ?p ?v
                            BIND ("${$scope.ctvdpd}"^^<http://www.w3.org/2001/XMLSchema#string> as ?input) .
                        }
                        LIMIT 1
                    }
                }
                }
                }

                           
                `) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';

                sparql_helpers.startLoading(src, $scope);
                $.ajax({
                        url: q
                    })
                    .done(function(response) {
                        sparql_helpers.fillFeatures(src, 'erosionCoord', response, 'erosionZone', {
                            erosionZone: 'erosionZone',
                            erosion: 'erosion'
                        }, map, $scope);
                        sparql_helpers.zoomToFetureExtent(src, me.cesium.viewer.camera, map);
                    })
            },
            createLayer: function(gettext) {
                lyr = new ol.layer.Vector({
                    title: gettext("Erosion zones"),
                    source: src,
                    visible: false,
                    style: function(feature, resolution) {
                        return [
                            new ol.style.Style({
                                stroke: new ol.style.Stroke({
                                    color: 'rgba(40, 150, 40, 0.6)',
                                    width: 2
                                }),
                                fill: new ol.style.Fill({
                                    color: 'rgba(40, 150, 40, 0.8)'
                                })
                            })
                        ];
                    }
                });
                return lyr;
            },
            getLayer() {
                return lyr;
            },
            init: function(_$scope, _$compile, _map, _utils) {
                $scope = _$scope;
                $compile = _$compile;
                map = _map;
                utils = _utils;
            }
        }
        return me;
    }
)
