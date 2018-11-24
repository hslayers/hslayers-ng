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
                entity.original_color = new Cesium.Color.fromCssColorString('rgb(31, 90, 186)');
                entity.polygon.material = new Cesium.ColorMaterialProperty(entity.original_color);
                entity.styled = true;
                entity.onmouseup = entityClicked
            }
        }

        var me = {
            get: function(map, utils, rect) {
                if (map.getView().getResolution() > lyr.getMaxResolution() || lyr.getVisible() == false) return;

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
PREFIX olu: <http://w3id.org/foodie/olu#>

SELECT ?waterBody ?label ?coordWBody
FROM <http://w3id.org/foodie/open/cz/water_buffer25#>
WHERE {
    ?waterBody a foodie-cz:WaterBody ;
            rdfs:label ?label ;
            geo:hasGeometry ?geoWBody .
            ?geoWBody ogcgs:asWKT ?coordWBody .
FILTER(bif:st_intersects (?coordWBody, bif:st_geomFromText("${extents}"))) .
}
                `) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';

                sparql_helpers.startLoading(src, $scope);
                $.ajax({
                        url: q
                    })
                    .done(function(response) {
                        sparql_helpers.fillFeatures(src, 'coordWBody', response, 'waterBody', {
                            waterBody: 'waterBody',
                            label: 'label'
                        }, map, $scope)
                    })
            },
            createLayer: function(gettext) {
                lyr = new ol.layer.Vector({
                    title: gettext("Water bodies"),
                    source: src,
                    visible: false,
                    maxResolution: 4.777314267823516 * 8,
                    style: function(feature, resolution) {
                        return [
                            new ol.style.Style({
                                fill: new ol.style.Stroke({
                                    color: 'rgba(0, 0, 220, 0.8)'
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
