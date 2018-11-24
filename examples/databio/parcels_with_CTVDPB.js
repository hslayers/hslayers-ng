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
            get: function(map, utils, rect) {
                if (lyr.getVisible() == false) return;

                function prepareCords(c) {
                    return c.toString().replaceAll(',', ' ')
                }
                var extents = `POLYGON ((${prepareCords(rect[0])}, ${prepareCords(rect[1])}, ${prepareCords(rect[2])}, ${prepareCords(rect[3])}, ${prepareCords(rect[0])}, ${prepareCords(rect[1])}))`;
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
                
                SELECT ?plot ?plotName ?code ?shortId ?cropName ?cropArea ?year ?coordPlot
                FROM <http://w3id.org/foodie/core/cz/CZpilot_fields#>
                WHERE{ 
                    ?plot a foodie:Plot ;
                    foodie:crop ?cropSpecies ;
                    geo:hasGeometry ?geoPlot .
                    OPTIONAL {?plot foodie:code ?code } .
                    OPTIONAL {?plot foodie-cz:plotName ?plotName } .
                    OPTIONAL {?plot foodie-cz:shortId ?shortId } .
                    ?geoPlot ogcgs:asWKT  ?coordPlot .
                    ?cropSpecies foodie:cropArea ?cropArea ;
                    common:validFrom ?validFrom ;
                    foodie:cropSpecies ?cropType .
                    ?cropType foodie:description ?cropName .
                    BIND (year(xsd:dateTime(?validFrom)) as ?year) .
                    FILTER(STRSTARTS(STR(?code),"${$scope.ctvdpd}") )
                    #FILTER (?year=2017) 
                }
                
                `) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';

                sparql_helpers.startLoading(src, $scope);
                $.ajax({
                        url: q
                    })
                    .done(function(response) {
                        sparql_helpers.fillFeatures(src, 'coordPlot', response, 'code', {
                            plot: 'plot',
                            shortId: 'shortId',
                            code: 'code'
                        }, map, $scope);
                        sparql_helpers.zoomToFetureExtent(src, me.cesium.viewer.camera, map);
                    })
            },
            createLayer: function(gettext) {
                lyr = new ol.layer.Vector({
                    title: gettext("Fields filtered by CTVDPD code"),
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
