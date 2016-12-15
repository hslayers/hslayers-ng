define(['angular', 'ol', 'map', 'd3'],

    function(angular, ol, map) {
        angular.module('hs.widgets.year_selector', ['hs.map'])
            .service('year_selector_service', ['hs.map.service', 'config', function(OlMap, config) {
                var me = {
                    year: 2013
                };

                function createCircleOutOverlay(position, ratios, size, color) {
                    var elem = document.createElement('div');
                    //Width and height
                    var w = size;
                    var h = size;

                    var dataset = [ratios.fatal, ratios.serious, ratios.slight];

                    var outerRadius = w / 2;
                    var innerRadius = 10;
                    var arc = d3.svg.arc()
                        .innerRadius(innerRadius)
                        .outerRadius(outerRadius);

                    var pie = d3.layout.pie();

                    var svg = d3.select("body")
                        .append("svg")
                        .attr("width", w)
                        .attr("height", h);

                    svg.append("circle")
                        .attr("cx", size / 2)
                        .attr("cy", size / 2)
                        .attr("r", 10)
                        .attr("fill", "rgba(255, 255, 255, 0.7)");


                    //Set up groups
                    var arcs = svg.selectAll("g.arc")
                        .data(pie(dataset))
                        .enter()
                        .append("g")
                        .attr("class", "arc")
                        .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

                    //Draw arc paths
                    arcs.append("path")
                        .attr("fill", function(d, i) {
                            return color[i];
                        })
                        .attr("d", arc);

                    svg.append("text")
                        .attr("transform", function(d) {
                            return "translate(" + size / 2 + "," + (size / 2 + 4) + ")";
                        })
                        .attr("text-anchor", "middle")
                        .text(function() {
                            return ratios.fatal + ratios.serious + ratios.slight
                        });

                    return new ol.Overlay({
                        element: svg.node(),
                        position: position,
                        positioning: 'center-center'
                    });
                }
                me.style = function(feature, resolution) {
                    if (feature.cashed_style) return feature.cashed_style;
                    var sum_severity = {
                        fatal: 0,
                        serious: 0,
                        slight: 0
                    };
                    for (var i = 0; i < feature.get('features').length; i++) {
                        var year_data = feature.get('features')[i].get('year_' + me.year);
                        sum_severity.fatal += year_data.structure.severity.fatal;
                        sum_severity.serious += year_data.structure.severity.serious;
                        sum_severity.slight += year_data.structure.severity.slight;
                    }
                    var total = sum_severity.fatal + sum_severity.serious + sum_severity.slight;
                    var size = Math.floor(50 + total / resolution * 3);

                    var coordinates = feature.getGeometry().getCoordinates();
                    var overlay = createCircleOutOverlay(coordinates, sum_severity, size, ['#ce2402', '#e5d032', '#099700']);
                    OlMap.map.addOverlay(overlay);
                    feature.overlay = overlay;
                    feature.cashed_style = [new ol.style.Style({
                        text: new ol.style.Text({
                            text: total,
                            fill: new ol.style.Fill({
                                color: '#000'
                            })
                        })
                    })];

                    return feature.cashed_style;
                };

                me.redraw = function() {
                    config.default_layers[1].getSource().forEachFeature(function(feature) {
                        feature.cashed_style = null;
                        if (feature.overlay) {
                            OlMap.map.removeOverlay(feature.overlay);
                        }
                        feature.set('r', Math.random());
                    })
                }

                return me;
            }])
            .directive('yearselector', function() {
                return {
                    templateUrl: hsl_path + 'examples/otn_charts/year_selector/partials/template.html',
                    link: function(scope, element) {
                        var link = document.createElement("link");
                        link.type = "text/css";
                        link.rel = "stylesheet";
                        link.href = hsl_path + 'lib/range_slider.css';
                        document.getElementsByTagName("head")[0].appendChild(link);
                    }
                };
            })

        .controller('YearSelector', ['$scope', 'hs.map.service', 'year_selector_service',
            function($scope, OlMap, year_selector_service) {
                $scope.year = 2013;
                $scope.yearChanged = function(year) {
                    year_selector_service.year = $scope.year;
                    year_selector_service.redraw();
                }
            }
        ]);

    });
