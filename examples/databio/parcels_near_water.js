define(['ol'],

    function (ol) {
        var src = new ol.source.Vector();
        var $scope;
        var $compile;
        var map;
        var utils;
        var olus_lyr;

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
                var name = entity.properties.code;
                var use = entity.properties.use.getValue();
                entity.polygon.outline = false;
                entity.polygon.material = new Cesium.Color.fromCssColorString('rgba(100, 100, 150, 0.5)');
                entity.styled = true;
                //entity.onclick = entityClicked
            }
        }

        var me = {
            get: function (map, utils, rect) {
                if (map.getView().getResolution() > 2.48657133911758 || olus_lyr.getVisible() == false) return;
                var format = new ol.format.WKT();
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


SELECT DISTINCT ?plot ?code ?shortId ?landUse ?coordPlotFinal
WHERE {
   ?plot geo:hasGeometry ?geoPlotFinal .
   ?geoPlotFinal ogcgs:asWKT  ?coordPlotFinal .
   FILTER(bif:st_intersects(?coordPlotFinal, ?coordWBody, 0.00025)) .
   
   GRAPH ?graph1 {
      SELECT ?plot ?code ?shortId ?landUse
      FROM <http://w3id.org/foodie/open/cz/180308_pLPIS_WGS#>
      WHERE{ 
         ?plot a foodie:Plot ;
            foodie:code ?code ;
            foodie-cz:shortId ?shortId ;
            olu:specificLandUse ?landUse ;
            geo:hasGeometry ?geoPlot .
         ?geoPlot ogcgs:asWKT  ?coordPlot .
         FILTER(bif:st_intersects (?coordPlot, bif:st_geomFromText("${extents}"))) .   
     }
   }
   GRAPH ?graph2 {
      SELECT ?waterBody ?label ?coordWBody
      FROM <http://w3id.org/foodie/open/cz/Water_bodies_buff25m_WGS#>
      WHERE {
          ?waterBody a foodie-cz:WaterBody ;
                 rdfs:label ?label ;
                 geo:hasGeometry ?geoWBody .
                 ?geoWBody ogcgs:asWKT ?coordWBody .
     FILTER(bif:st_intersects (?coordWBody, bif:st_geomFromText("${extents}"))) .
      }
   }
}
                `) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';

                src.set('loaded', false);
                $.ajax({
                    url: utils.proxify(q)
                })
                    .done(function (response) {
                        if (angular.isUndefined(response.results)) return;
                        var features = [];
                        for (var i = 0; i < response.results.bindings.length; i++) {
                            try {
                                var b = response.results.bindings[i];
                                if (b.coordPlotFinal.datatype == "http://www.openlinksw.com/schemas/virtrdf#Geometry" && b.coordPlotFinal.value.indexOf('e+') == -1 && b.coordPlotFinal.value.indexOf('e-') == -1) {
                                    if (src.getFeatureById(b.code.value) == null) {
                                        var g_feature = format.readFeature(b.coordPlotFinal.value.toUpperCase());
                                        var ext = g_feature.getGeometry().getExtent()
                                        var geom_transformed = g_feature.getGeometry().transform('EPSG:4326', map.getView().getProjection());
                                        var feature = new ol.Feature({ geometry: geom_transformed, parcel: b.code.value, use: b.landUse.value });
                                        feature.setId(b.code.value);
                                        features.push(feature);
                                    } else {
                                        src.getFeatureById(b.code.value).set('flaged', false);
                                    }
                                }
                            } catch (ex) {
                                console.log(ex);
                            }
                        }
                        src.addFeatures(features);
                        src.getFeatures().forEach(function (feature) {
                            if (feature.get('flaged') == true) src.removeFeature(feature);
                        })
                        src.set('loaded', true);
                        src.dispatchEvent('features:loaded', src);
                    })
            },
            createLayer: function () {
                olus_lyr = new ol.layer.Vector({
                    title: "Plots intersecting water bodies",
                    source: src,
                    visible: true,
                    style: function (feature, resolution) {
                        var use = feature.get('use').split('/');
                        use = use[use.length - 1];
                        return [
                            new ol.style.Style({
                                stroke: new ol.style.Stroke({
                                    color: utils.rainbow(350, use, 0.8),
                                    width: 2
                                })
                            })
                        ];
                    }
                });
                return olus_lyr;
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
