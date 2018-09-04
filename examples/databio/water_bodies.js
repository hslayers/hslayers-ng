define(['ol', 'sparql_helpers'],

    function (ol, sparql_helpers) {
        var src = new ol.source.Vector();
        var $scope;
        var $compile;
        var map;
        var utils;
        var lyr;

        function entityClicked(entity) {
            $scope.showInfo(entity);
            if ($('#zone-info-dialog').length > 0) {
                angular.element('#zone-info-dialog').parent().remove();
            }
            var el = angular.element('<div hs.foodiezones.info-directive></div>');
            $("#hs-dialog-area").append(el);
            $compile(el)($scope);
        }

        src.cesiumStyler = function (dataSource) {
            var entities = dataSource.entities.values;
            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i];
                if (entity.styled) continue;
                entity.polygon.outline = false;
                entity.polygon.material = new Cesium.Color.fromCssColorString('rgb(31, 90, 186)');
                entity.styled = true;
                //entity.onclick = entityClicked
            }
        }

        var me = {
            get: function (map, utils, rect) {
                if (map.getView().getResolution() > lyr.getMaxResolution() || lyr.getVisible() == false) return;
                function prepareCords(c) {
                    return c.toString().replaceAll(',', ' ')
                }
                var extents = `POLYGON ((${prepareCords(rect[0])}, ${prepareCords(rect[1])}, ${prepareCords(rect[2])}, ${prepareCords(rect[3])}, ${prepareCords(rect[0])}, ${prepareCords(rect[1])}))`;
                console.log(extents);
                //console.log(extents);
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
FROM <http://w3id.org/foodie/open/cz/Water_bodies_buff25m_WGS#>
WHERE {
    ?waterBody a foodie-cz:WaterBody ;
            rdfs:label ?label ;
            geo:hasGeometry ?geoWBody .
            ?geoWBody ogcgs:asWKT ?coordWBody .
FILTER(bif:st_intersects (?coordWBody, bif:st_geomFromText("${extents}"))) .
}
                `) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';

                src.set('loaded', false);
                $.ajax({
                    url: utils.proxify(q)
                })
                    .done(function (response) {
                        sparql_helpers.fillFeatures(src, 'coordWBody', response, 'waterBody', {waterBody: 'waterBody', label: 'label'}, map)
                    })
            },
            createLayer: function () {
                lyr = new ol.layer.Vector({
                    title: "Water bodies",
                    source: src,
                    visible: true,
                    maxResolution: 0.000171661376953125,
                    style: function (feature, resolution) {
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
            getLayer(){
                return lyr;
            },
            init: function (_$scope, _$compile, _map, _utils) {
                $scope = _$scope;
                $compile = _$compile;
                map = _map;
                utils = _utils;
            }
        }
        return me;
    }
)
