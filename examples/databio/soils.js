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
                entity.polygon.material = new Cesium.Color.fromCssColorString('rgba(237, 189, 113, 0.6)');
                var polyPositions = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions;
                var polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
                polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);
                entity.position = polyCenter;
                entity.label = new Cesium.LabelGraphics({
                    text: entity.properties.code.getValue(),
                    font: '16px Helvetica',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    showBackground: true,
                    style: Cesium.LabelStyle.FILL,
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(10.0, 10000.0),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    scaleByDistance: new Cesium.NearFarScalar(500, 1, 20000, 0.0),
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                })
                entity.styled = true;
                //entity.onclick = entityClicked
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
                PREFIX common: <http://portele.de/ont/inspire/baseInspire#>


                SELECT DISTINCT ?plot ?soilType ?code ?shortId ?landUse ?coordPlotFinal
                FROM <http://w3id.org/foodie/open/cz/pLPIS_180616_WGS#>
                WHERE {
                ?plot a foodie:Plot ;
                        foodie:code ?code ;
                        foodie-cz:shortId ?shortId ;
                        olu:specificLandUse ?landUse ;
                        geo:hasGeometry ?geoPlotFinal .
                    ?geoPlotFinal ogcgs:asWKT  ?coordPlotFinal .
                    FILTER(bif:st_intersects(?coordPlotFinal, ?coordSoil)) .
                    GRAPH ?graph1 {
                        SELECT ?soil (?label as ?soilType) ?codeSoil ?description ?link ?coordSoil
                        FROM <http://w3id.org/foodie/open/cz/Soil_maps_BPEJ_WGSc#>
                        WHERE {
                            ?soil a foodie:Plot ;
                                    geo:hasGeometry ?geoSoil .
                            optional {?soil rdfs:label ?label }.
                            optional {?soil foodie:code ?codeSoil }.
                            optional {?soil common:link ?link }.
                            optional {?soil foodie:description ?description }.
                            ?geoSoil ogcgs:asWKT ?coordSoil .
                            FILTER(STRSTARTS(STR(?label),"${$scope.soilType}") ).
                        FILTER(bif:st_intersects (?coordSoil, bif:st_geomFromText("${extents}"))) .
                        }
                    }
                }
                `) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
                sparql_helpers.startLoading(src, $scope);
                $.ajax({
                        url: q
                    })
                    .done(function(response) {
                        sparql_helpers.fillFeatures(src, 'coordPlotFinal', response, 'code', {
                            plot: 'plot',
                            shortId: 'shortId',
                            code: 'code',
                            soilType: 'soilType'
                        }, map, $scope, $scope)
                    })
            },
            createLayer: function(gettext) {
                lyr = new ol.layer.Vector({
                    title: gettext("Fields with soil type"),
                    maxResolution: 4.777314267823516,
                    source: src,
                    visible: false,
                    style: function(feature, resolution) {
                        return [
                            new ol.style.Style({
                                stroke: new ol.style.Stroke({
                                    color: 'rgba(237, 189, 113, 0.6)',
                                    width: 2
                                }),
                                fill: new ol.style.Fill({
                                    color: 'rgba(237, 189, 113, 0.8)'
                                })
                            })
                        ];
                    }
                });
                return lyr;
            },
            fillClassificators() {
                var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent(`PREFIX foodie-cz: <http://foodie-cloud.com/model/foodie-cz#>
                PREFIX geo: <http://www.opengis.net/ont/geosparql#>
                PREFIX geof: <http://www.opengis.net/def/function/geosparql/>
                PREFIX virtrdf:	<http://www.openlinksw.com/schemas/virtrdf#> 
                PREFIX poi: <http://www.openvoc.eu/poi#> 
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                PREFIX foodie-cz: <http://foodie-cloud.com/model/foodie-cz#>
                PREFIX foodie: <http://foodie-cloud.com/model/foodie#>
                PREFIX olu: <http://w3id.org/foodie/olu#>
                PREFIX common: <http://portele.de/ont/inspire/baseInspire#>
                
                SELECT DISTINCT ?label
                FROM <http://w3id.org/foodie/open/cz/Soil_maps_BPEJ_WGSc#>
                WHERE {
                    ?soil a foodie:Plot .
                    optional {?soil rdfs:label ?label }.
                }
                
                `) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
                $.ajax({
                        url: utils.proxify(q)
                    })
                    .done(function(response) {
                        $scope.soilTypes = response.results.bindings.map(function(r) {
                            return r.label.value;
                        })
                    })
            },
            getLayer() {
                return lyr;
            },
            init: function(_$scope, _$compile, _map, _utils) {
                $scope = _$scope;
                $compile = _$compile;
                map = _map;
                utils = _utils;
                me.fillClassificators();
            }
        }
        return me;
    }
)
