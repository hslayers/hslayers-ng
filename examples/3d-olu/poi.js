define(['ol'],

    function (ol) {
        var spoi_source = new ol.source.Vector();
        var $scope;
        var $compile;

        function entityClicked(entity) {
            $scope.showInfo(entity);
            if ($('#zone-info-dialog').length > 0) {
                angular.element('#zone-info-dialog').parent().remove();
            }
            var el = angular.element('<div hs.foodiezones.info-directive></div>');
            $("#hs-dialog-area").append(el);
            $compile(el)($scope);
        }

        spoi_source.cesiumStyler = function (dataSource) {
            var entities = dataSource.entities.values;
            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i];
                var name = entity.properties.label;
                var s = entity.properties.category.getValue();
                if (typeof s === 'undefined') return;
                s = s.split("#")[1];
                var allowed = 'archaeological_site.png  artwork.png  bank.png      cafe.png       car_wash.png  fast_food.png  hotel.png        library.png   other.png    place_of_worship.png  restaurant.png   viewpoint.png     zoo.png arts_centre.png          atm.png      bus_stop.png  camp_site.png  dentist.png   fountain.png   information.png  memorial.png  parking.png  pub.png              supermarket.png  waste_basket.png';
                if (allowed.indexOf(s + '.png') > -1)
                    s = '../foodie-zones/symbols/' + s + '.png';
                else
                    s = '../foodie-zones/symbols/other.png';
                entity.billboard.scaleByDistance = new Cesium.NearFarScalar(50, 1.5, 15000, 0.0);
                entity.billboard.image = s;
                switch (entity.properties.category.getValue()) {
                    case 'http://gis.zcu.cz/SPOI/Ontology#peak':
                        entity.label = new Cesium.LabelGraphics({
                            text: entity.properties.label,
                            font: '18px Helvetica',
                            fillColor: Cesium.Color.WHITE,
                            outlineColor: new Cesium.Color(0.64, 0.1725490, 0.749019, 0.9),
                            outlineWidth: 2,
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            pixelOffset: new Cesium.Cartesian2(0, -36),
                            scaleByDistance: new Cesium.NearFarScalar(50, 1.5, 15000, 0.0),
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                        }); break;
                    case 'http://gis.zcu.cz/SPOI/Ontology#village':
                        entity.label = new Cesium.LabelGraphics({
                            text: entity.properties.label,
                            font: '14px Helvetica',
                            fillColor: Cesium.Color.WHITE,
                            outlineColor: Cesium.Color.BLACK,
                            showBackground: true,
                            style: Cesium.LabelStyle.FILL,
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            pixelOffset: new Cesium.Cartesian2(0, -36),
                            scaleByDistance: new Cesium.NearFarScalar(50, 1.5, 15000, 0.0),
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                        }); break;
                    default:
                }
                entity.onclick = entityClicked
            }
        }

        return {
            getPois: function (map, utils, rect) {
                if (map.getView().getResolution() > 8.48657133911758) return;
                var format = new ol.format.WKT();
                function prepareCords(c) {
                    return c.toString().replaceAll(',', ' ')
                }
                var extents = `POLYGON ((${prepareCords(rect[0])}, ${prepareCords(rect[1])}, ${prepareCords(rect[2])}, ${prepareCords(rect[3])}, ${prepareCords(rect[0])}, ${prepareCords(rect[1])}))`;
                //console.log(extents);
                var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent(`PREFIX geo: <http://www.opengis.net/ont/geosparql#> 
                PREFIX geof: <http://www.opengis.net/def/function/geosparql/> 
                PREFIX virtrdf: <http://www.openlinksw.com/schemas/virtrdf#> 
                PREFIX poi: <http://www.openvoc.eu/poi#> 
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
                SELECT ?poi ?wkt ?sub ?label FROM <http://www.sdi4apps.eu/poi.rdf> 
                WHERE {?poi geo:asWKT ?wkt . 
                    FILTER(bif:st_intersects(bif:st_geomfromtext("${extents}"), ?wkt)).
                    ?poi <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?sub. 
                    ?sub <http://www.w3.org/2000/01/rdf-schema#subClassOf> ?categ.
                    ?poi <http://www.w3.org/2000/01/rdf-schema#label> ?label
                }`) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';

                spoi_source.set('loaded', false);
                $.ajax({
                    url: utils.proxify(q)
                })
                    .done(function (response) {
                        if (angular.isUndefined(response.results)) return;
                        var features = [];
                        for (var i = 0; i < response.results.bindings.length; i++) {
                            try {
                                var b = response.results.bindings[i];
                                if (b.wkt.datatype == "http://www.openlinksw.com/schemas/virtrdf#Geometry" && b.wkt.value.indexOf('e+') == -1 && b.wkt.value.indexOf('e-') == -1) {
                                    var g_feature = format.readFeature(b.wkt.value.toUpperCase());
                                    var ext = g_feature.getGeometry().getExtent()
                                    var geom_transformed = g_feature.getGeometry().transform('EPSG:4326', map.getView().getProjection());
                                    var feature = new ol.Feature({ geometry: geom_transformed, poi: b.poi.value, category: b.sub.value, label: b.label.value });
                                    features.push(feature);
                                }
                            } catch (ex) {
                                if(console) console.log(ex);
                            }
                        }
                        spoi_source.clear();
                        spoi_source.addFeatures(features);
                        spoi_source.set('loaded', true);
                        spoi_source.dispatchEvent('features:loaded', spoi_source);
                    })
            },
            createPoiLayer: function () {
                return new ol.layer.Vector({
                    title: "Points of interest",
                    source: spoi_source,
                    style: function (feature, resolution) {
                        var s = feature.get('category');
                        if (typeof s === 'undefined') return;
                        s = s.split("#")[1];
                        var allowed = 'archaeological_site.png  artwork.png  bank.png      cafe.png       car_wash.png  fast_food.png  hotel.png        library.png   other.png    place_of_worship.png  restaurant.png   viewpoint.png     zoo.png arts_centre.png          atm.png      bus_stop.png  camp_site.png  dentist.png   fountain.png   information.png  memorial.png  parking.png  pub.png              supermarket.png  waste_basket.png';
                        if (allowed.indexOf(s + '.png') > -1)
                            s = '../foodie-zones/symbols/' + s + '.png';
                        else
                            s = '../foodie-zones/symbols/other.png'
                        return [
                            new ol.style.Style({
                                image: new ol.style.Icon({
                                    anchor: [0.5, 1],
                                    src: s,
                                    size: [30, 35],
                                    crossOrigin: 'anonymous'
                                })
                            })
                        ]
                    },
                    visible: true
                })
            },
            init: function (_$scope, _$compile) {
                $scope = _$scope;
                $compile = _$compile;
            }
        }
    }
)
