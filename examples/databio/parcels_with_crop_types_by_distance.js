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
                var polyPositions = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions;
                var polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
                polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);
                entity.position = polyCenter;
                entity.label = new Cesium.LabelGraphics({
                    text: entity.properties.code.getValue() + ' ' + entity.properties.cropName.getValue(),
                    font: '16px Helvetica',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    showBackground: true,
                    style: Cesium.LabelStyle.FILL,
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(10.0, 30000.0),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    scaleByDistance: new Cesium.NearFarScalar(500, 1, 70000, 0.0),
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                })
                entity.original_color = new Cesium.Color.fromCssColorString('rgba(150, 40, 40, 0.6)');
                entity.polygon.material = new Cesium.ColorMaterialProperty(entity.original_color);
                entity.styled = true;
                entity.onmouseup = entityClicked
            }
        }

        var me = {
            get: function(map, utils, distance, center) {
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

SELECT ?plot ?plotName ?code ?shortId ?cropName ?cropArea ?distance ?year ?coordPlot
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
    ${$scope.cropType!='' && typeof $scope.cropType!='undefined' && $scope.cropType != "http://w3id.org/foodie/core/CZpilot_fields/CropType/" ? `FILTER(?cropType = <${$scope.cropType}>).` : ''}
    BIND (bif:ST_XMin(?coordPlot) AS ?xmin) .
    BIND (bif:ST_YMin(?coordPlot) AS ?ymin) .
    BIND (bif:ST_XMax(?coordPlot) AS ?xmax) .
    BIND (bif:ST_YMax(?coordPlot) AS ?ymax) .
    BIND ((?xmin + ?xmax)/2 AS ?x) .
    BIND ((?ymin + ?ymax)/2 AS ?y) .
    BIND (bif:st_distance(bif:st_point(?x, ?y), bif:st_geomFromText("POINT(${center[0]} ${center[1]})")) as ?distance) .
    BIND (year(xsd:dateTime(?validFrom)) as ?year) .
    FILTER (?distance <=${distance}) .
}

                `) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';

                sparql_helpers.startLoading(src, $scope);
                $.ajax({
                        url: q
                    })
                    .done(function(response) {
                        sparql_helpers.fillFeatures(src, 'coordPlot', response, 'code', {
                            plotName: 'plotName',
                            plot: 'plot',
                            shortId: 'shortId',
                            code: 'code',
                            cropName: 'cropName',
                            cropArea: 'cropArea'
                        }, map, $scope);
                        sparql_helpers.zoomToFetureExtent(src, me.cesium.viewer.camera, map);
                    })
            },
            createLayer: function(gettext) {
                lyr = new ol.layer.Vector({
                    title: gettext("Fields by crop types and distance"),
                    source: src,
                    visible: false,
                    style: function(feature, resolution) {
                        return [
                            new ol.style.Style({
                                stroke: new ol.style.Stroke({
                                    color: 'rgba(150, 40, 40, 0.8)',
                                    width: 2
                                }),
                                fill: new ol.style.Fill({
                                    color: 'rgba(150, 40, 40, 0.8)'
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
