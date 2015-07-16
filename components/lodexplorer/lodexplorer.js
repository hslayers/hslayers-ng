/**
* @namespace hs.lodexplorer
* @memberOf hs  
*/ 
define(['ol', 'dc', 'map', 'query', 'core', 'drag'],

    function(ol, dc) {
        var module = angular.module('hs.lodexplorer', ['hs.drag', 'hs.map', 'hs.query', 'hs.core'])
            .directive('hs.lodexplorer.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/lodexplorer/partials/lodexplorer.html',
                    link: function(scope, element) {

                    }
                };
            }).service("hs.lodexplorer.service_sparqllog", [
                function() {
                    var me = {
                        logs: []
                    };
                    return me;
                }
            ]).directive('hs.lodexplorer.directiveSparqllogdialog', function() {
                return {
                    templateUrl: hsl_path + 'components/lodexplorer/partials/sparqllogdialog.html',
                };
            }).controller('hs.lodexplorer.controller_sparqllogdialog', ['$scope', 'hs.lodexplorer.service_sparqllog',
                function($scope, SparqlLogService) {
                    $scope.sparql_log = SparqlLogService.logs;
                }
            ])

        .controller('hs.lodexplorer.controller', ['$scope', 'hs.map.service', 'hs.query.service_infopanel', 'hs.lodexplorer.service_sparqllog', 'Core',
            function($scope, OlMap, InfoPanelService, SparqlLogService, Core) {
                var lyr = null;
                var map = OlMap.map;
                var interval_chart = dc.barChart("#dc-magnitude-chart", "filtered");
                var range_chart = dc.barChart("#dc-magnitude-chart2", "filter");
                var feature_map = {};

                $scope.ajax_loader = hsl_path + 'components/lodexplorer/ajax-loader.gif';
                $scope.loading = false;
                $scope.sparql_log = [];
                $scope.sources = [{
                        url: "http://eurostat.linked-statistics.org/data/nama_r_e2gdp.rdf",
                        name: "Gross domestic product (GDP) at current market prices by NUTS 2 regions"
                    }, {
                        url: "http://eurostat.linked-statistics.org/data/demo_r_frate2.rdf",
                        name: "Fertility rates by age - NUTS 2 regions"
                    },
                    /*{
                                            url: "http://eurostat.linked-statistics.org/data/demo_r_mlifexp.rdf",
                                            name: "Life expectancy at given exact age (ex) - NUTS 2 regions"
                                        },*/
                    {
                        url: "http://eurostat.linked-statistics.org/data/hlth_rs_prsrg.rdf",
                        name: "Health personnel by NUTS 2 regions"
                    }, {
                        url: "http://eurostat.linked-statistics.org/data/ef_kvftreg.rdf",
                        name: "Key variables: area, livestock (LSU), labour force and standard output (SO) by type of farming (2-digit)"
                    }
                ]

                $scope.setSources = function(sources) {
                    $scope.sources = sources;
                    if (!$scope.$$phase) $scope.$digest();
                }

                $scope.groupings = [];

                $scope.styleFunction = function(feature, resolution) {
                    if (Number.MIN_VALUE != feature.gradient_value) {
                        return [new ol.style.Style({
                            fill: new ol.style.Fill({
                                color: $scope.rainbow(1, feature.gradient_value, feature.opacity ? feature.opacity : 0),
                            }),
                            stroke: new ol.style.Stroke({
                                color: 'rgba(100, 100, 100, 0.3)'
                            })
                        })]
                    } else {
                        return [new ol.style.Style({
                            fill: new ol.style.Fill({
                                color: [0xbb, 0xbb, 0xbb, 0.9]
                            }),
                            stroke: new ol.style.Stroke({
                                color: 'rgba(100, 100, 100, 0.3)'
                            })
                        })]
                    }
                }

                $scope.rainbow = function(numOfSteps, step, opacity) {
                    // based on http://stackoverflow.com/a/7419630
                    // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distiguishable vibrant markers in Google Maps and other apps.
                    // Adam Cole, 2011-Sept-14
                    // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
                    var r, g, b;
                    var h = step / (numOfSteps * 1.00000001);
                    var i = ~~(h * 4);
                    var f = h * 4 - i;
                    var q = 1 - f;
                    switch (i % 4) {
                        case 2:
                            r = f, g = 1, b = 0;
                            break;
                        case 0:
                            r = 0, g = f, b = 1;
                            break;
                        case 3:
                            r = 1, g = q, b = 0;
                            break;
                        case 1:
                            r = 0, g = 1, b = q;
                            break;
                    }
                    var c = "rgba(" + ~~(r * 235) + "," + ~~(g * 235) + "," + ~~(b * 235) + ", " + opacity + ")";
                    return (c);
                }

                $scope.chooseSource = function(source) {
                    var sparql = ["SELECT DISTINCT ?classif",
                        "FROM <" + source + ">",
                        "WHERE {",
                        "?s a <http://purl.org/linked-data/cube#Observation>;",
                        "    ?property ?classif .",
                        "FILTER(isIri(?classif) and ?property != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ",
                        "    and ?property != <http://purl.org/linked-data/cube#dataSet> ",
                        ")",
                        "}"
                    ].join("\n");
                    if (console) console.log(sparql);
                    var url = "http://ha.isaf2014.info:8890/sparql?default-graph-uri=&query=" + window.escape(sparql) + "&format=application%2Fsparql-results%2Bjson&timeout=2000&debug=off";
                    $scope.loading = true;
                    $.ajax({
                        url: url,
                        success: classifsDownloaded
                    });
                }

                var from_list = "";
                var classifsDownloaded = function(j) {
                    $scope.classifs_loaded = true;
                    var unique_classifs = {};
                    from_list = "";
                    for (var i = 0; i < j.results.bindings.length; i++) {
                        var part = j.results.bindings[i].classif.value.split("#")[0];
                        if (!(unique_classifs[part])) {
                            unique_classifs[part] = part;
                            from_list += "FROM <" + part + ".rdf>\n";
                        }
                    }
                    var sparql = ["SELECT ?property, ?value",
                        "FROM <" + $scope.source + ">",
                        "WHERE {",
                        "{ SELECT ?s WHERE {?s a <http://purl.org/linked-data/cube#Observation>} LIMIT 1}.",
                        "?s ?property ?value .",
                        "FILTER(?property NOT IN ( <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>, <http://purl.org/linked-data/cube#dataSet>, <http://eurostat.linked-statistics.org/property#geo>, <http://purl.org/linked-data/sdmx/2009/measure#obsValue>))",
                        "}"
                    ].join("\n");
                    if (console) console.log(sparql);
                    var url = "http://ha.isaf2014.info:8890/sparql?default-graph-uri=&query=" + window.escape(sparql) + "&format=application%2Fsparql-results%2Bjson&timeout=2000&debug=off";
                    $.ajax({
                        url: url,
                        success: propertiesDownloaded
                    });
                }

                var propertiesDownloaded = function(j) {
                    var tmp = j.results.bindings;
                    var groups = {};
                    for (var i = 0; i < tmp.length; i++) {
                        var part = tmp[i].property.value.split("#")[1];
                        if (!(groups[part])) {
                            groups[part] = {
                                name: part,
                                property: tmp[i].property.value,
                                datatype: tmp[i].value.datatype ? tmp[i].value.datatype : "url"
                            };
                        }
                    }
                    $scope.groupings = groups;
                    $scope.loading = false;
                    if (!$scope.$$phase) $scope.$digest();
                    display();
                }

                var display = function(j) {
                    var filter = "";
                    $scope.loading = true;
                    var extra_column_selectors = "";
                    var extra_columns = "";
                    angular.forEach($scope.groupings, function(val, key) {
                        var value = "";
                        if (val.value) {
                            switch (val.datatype) {
                                case "http://www.w3.org/2001/XMLSchema#date":
                                    value = "xsd:dateTime('" + val.value + "')"
                                    break;
                                default:
                                    value = "<" + val.value + ">"
                            };
                            filter += " ?measurement <" + val.property + "> ?filter" + val.name + ". FILTER(?filter" + val.name + " = " + value + " ).\n";
                        }
                        switch (val.datatype) {
                            case "http://www.w3.org/2001/XMLSchema#date":
                                extra_column_selectors += "OPTIONAL{?measurement <" + val.property + "> ?" + val.name + "}. \n";
                                extra_columns += ", ?" + val.name;
                                break;
                            default:
                                extra_column_selectors += "OPTIONAL{?measurement <" + val.property + "> ?m_" + val.name + ". ?m_" + val.name + " skos:prefLabel ?" + val.name + "}. \n";
                                extra_columns += ", str(?" + val.name + ") as ?" + val.name;
                        }

                    });

                    var sparql = [
                        "PREFIX property: <http://eurostat.linked-statistics.org/property#>",
                        "PREFIX measure: <http://purl.org/linked-data/sdmx/2009/measure#>",
                        "SELECT DISTINCT str(?code) as ?code, (xsd:decimal(?value) as ?value)" + extra_columns,
                        "FROM <" + $scope.source + ">",
                        "FROM <http://www.w3.org/2004/02/skos/core>",
                        "FROM <http://eurostat.linked-statistics.org/dic/unit>",
                        //                        "FROM <http://purl.org/linked-data/cube>",
                        "FROM <http://ha.isaf2014.info/nuts_supported.rdf>",
                        from_list,
                        "WHERE {",
                        "?measurement a <http://purl.org/linked-data/cube#Observation>;",
                        "measure:obsValue ?value;",
                        "property:geo ?location.",
                        "?location <http://ha.isaf2014.info/nuts_supported.rdf#supported> true.",
                        extra_column_selectors,
                        "?location skos:notation ?code.",
                        filter,
                        "}"
                    ].join("\n");
                    if (console) console.log(sparql);
                    var d = new Date();
                    SparqlLogService.logs.unshift({
                        date: d.toLocaleString(),
                        query: sparql,
                        date_val: d.valueOf()
                    });
                    var url = "http://ha.isaf2014.info:8890/sparql?default-graph-uri=&query=" + window.escape(sparql) + "&format=application%2Fsparql-results%2Bjson&timeout=0&debug=off";
                    $.ajax({
                        url: url,
                        success: dataDownloaded
                    });
                }

                var dataDownloaded = function(j) {
                    var max = Number.MIN_VALUE;
                    var min = Number.MAX_VALUE;
                    var max_filtered = Number.MIN_VALUE;
                    var min_filtered = Number.MAX_VALUE;
                    var pies = [];
                    var val;
                    var data = [];
                    lyr.getSource().forEachFeature(function(feature) {
                        feature.gradient_value = Number.MIN_VALUE;
                        feature_map[feature.get('nuts_id')] = feature;
                        //console.log("INSERT INTO <http://ha.isaf2014.info/nuts_supported> {<http://eurostat.linked-statistics.org/dic/geo#"+feature.get('nuts_id')+"> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>  <http://www.w3.org/2004/02/skos/core#Concept> . };" );
                        feature.opacity = 0.9;
                    })

                    for (var i = 0; i < j.results.bindings.length; i++) {
                        if (feature_map[j.results.bindings[i].code.value]) {
                            val = parseFloat(j.results.bindings[i].value.value);
                            var data_item = {};
                            for (var property in j.results.bindings[i]) {
                                if (j.results.bindings[i].hasOwnProperty(property)) {
                                    if (j.results.bindings[i][property].dataType && j.results.bindings[i][property].dataType == "http://www.w3.org/2001/XMLSchema#date") {
                                        data_item[property] = j.results.bindings[i][property].value.substr(0, 10);
                                    } else {
                                        data_item[property] = j.results.bindings[i][property].value;
                                    }
                                }
                            }
                            data_item.value = val;
                            max = val > max ? val : max;
                            min = val < min ? val : min;
                            data.push(data_item);
                        }
                    }
                    min_filtered = min;
                    max_filtered = max;

                    var facts = crossfilter(data);

                    lyr.getSource().forEachFeature(function(feature) {
                        feature.gradient_value = Number.MIN_VALUE;
                        feature_map[feature.get('nuts_id')] = feature;
                        feature.opacity = 0.9;
                    })

                    var range = max - min;
                    var interval_size = range / 40.0;
                    var interval_size_filtered = range / 40.0;

                    var createIntervals = function(d) {
                        return ~~((d.value - min) / interval_size);
                    };

                    var createFilteredIntervals = function(d) {
                        return ~~((d.value - min_filtered) / interval_size_filtered);
                    };

                    var base_dimension = facts.dimension(function(d) {
                        return d.value
                    });
                    var base_dimension_counts = base_dimension.group().reduceCount(function(d) {
                        return d.value
                    });

                    var interval_dimension = facts.dimension(createFilteredIntervals);
                    var interval_dimension_counts = interval_dimension.group().reduceCount(createFilteredIntervals);

                    var range_dimension = facts.dimension(createIntervals);
                    var range_dimension_counts = range_dimension.group().reduceCount(createIntervals);

                    var colorize_regions = function(chart, filter) {
                        var data_items = interval_dimension.top(Infinity);
                        var max = Number.MIN_VALUE;
                        var min = Number.MAX_VALUE;

                        if (filter) {
                            max = min_filtered + filter[1] * interval_size_filtered;
                            min = min_filtered + filter[0] * interval_size_filtered;
                        } else {
                            data_items.forEach(function(key) {
                                var val = key.value;
                                max = val > max ? val : max;
                                min = val < min ? val : min;
                            });
                        }
                        var range = max - min;
                        var interval_size = range / 40.0;

                        lyr.getSource().forEachFeature(function(feature) {
                            var val = feature.get('data_value');
                            if (val < min || val > max)
                                feature.opacity = 0.1;
                        });
                        data_items.forEach(function(key) {
                            if (feature_map[key.code] && key.value >= min && key.value <= max) {
                                feature_map[key.code].opacity = 0.9;
                                feature_map[key.code].gradient_value = (key.value - min) / (max - min);
                                feature_map[key.code].set('data_value', key.value);
                            }
                        });
                    }

                    var generateFilteredIntervals = function(chart, filter) {
                        if (filter) {
                            max_filtered = min + filter[1] * interval_size;
                            min_filtered = min + filter[0] * interval_size;
                            interval_size_filtered = (max_filtered - min_filtered) / 40.0;
                            dc.events.trigger(function() {
                                interval_chart.getChartStack().clear();
                                interval_dimension = crossfilter(range_dimension.top(Infinity)).dimension(createFilteredIntervals);
                                interval_dimension_counts = interval_dimension.group().reduceCount(createFilteredIntervals);
                                interval_chart.dimension(interval_dimension)
                                    .group(interval_dimension_counts);
                                interval_chart.render();
                                colorize_regions(chart, null);
                            });

                        }
                    }

                    range_chart.width($("#lod_data_panel").width() - 35)
                        .height(130)
                        .margins({
                            top: 3,
                            right: 10,
                            bottom: 20,
                            left: 30
                        })
                        .dimension(range_dimension) // the values across the x axis
                        .group(range_dimension_counts) // the values on the y axis
                        .transitionDuration(500)
                        .centerBar(true)
                        .gap(50)
                        .x(d3.scale.linear().domain([0, 40]))
                        .xUnits(function() {
                            return 10;
                        }).on("filtered", generateFilteredIntervals)
                        .elasticY(true).xAxis().tickFormat(function(v) {
                            return (min + v * interval_size).toFixed(2);
                        });

                    interval_chart.width($("#lod_data_panel").width() - 35)
                        .height(130)
                        .margins({
                            top: 3,
                            right: 10,
                            bottom: 20,
                            left: 30
                        })
                        .dimension(interval_dimension) // the values across the x axis
                        .group(interval_dimension_counts) // the values on the y axis
                        .transitionDuration(500)
                        .centerBar(true)
                        .gap(50)
                        .x(d3.scale.linear().domain([0, 40]))
                        .xUnits(function() {
                            return 10;
                        })
                        .elasticY(true).on("filtered", colorize_regions).xAxis().tickFormat(function(v) {
                            return (min_filtered + v * interval_size_filtered).toFixed(2);
                        });

                    var pie_filters_changed = function(chart, filter) {
                        var data_items = base_dimension.top(Infinity);
                        max = Number.MIN_VALUE;
                        min = Number.MAX_VALUE;

                        data_items.forEach(function(key) {
                            var val = key.value;
                            max = val > max ? val : max;
                            min = val < min ? val : min;
                        });
                        range = max - min;
                        interval_size = range / 40.0;
                        range_chart.getChartStack().clear();
                        range_dimension = crossfilter(base_dimension.top(Infinity)).dimension(createIntervals);
                        range_dimension_counts = range_dimension.group().reduceCount(createIntervals);
                        range_chart.dimension(range_dimension).group(range_dimension_counts);
                        range_chart.filterAll();
                        interval_chart.getChartStack().clear();
                        min_filtered = min;
                        max_filtered = max;
                        interval_size_filtered = range / 40.0;
                        interval_dimension = crossfilter(range_dimension.top(Infinity)).dimension(createFilteredIntervals);
                        interval_dimension_counts = interval_dimension.group().reduceCount(createFilteredIntervals);
                        interval_chart.dimension(interval_dimension)
                            .group(interval_dimension_counts);
                        interval_chart.render();
                        range_chart.redraw();
                        dc.events.trigger(function() {
                            interval_chart.render();
                        }, 600);
                        colorize_regions(chart, null);
                    }

                    angular.forEach($scope.groupings, function(val, key) {
                        var colValue = facts.dimension(function(d) {
                            return d[val.name] ? d[val.name] : "NaN";
                        });
                        var colValueGroupCount = colValue.group().reduceCount(function(d) {
                            return d[val.name] ? d[val.name] : "NaN";
                        });
                        switch (val.datatype) {
                            case "http://www.w3.org/2001/XMLSchema#date":
                                var chart = dc.rowChart('#chart' + val.name);
                                chart.width($("#lod_data_panel").width() - 35)
                                    .height(colValueGroupCount.size() * 23 + 40).labelOffsetY(12)
                                    .dimension(colValue) // set dimension
                                    .group(colValueGroupCount) // set group
                                    .on("filtered", pie_filters_changed);
                                pies.push(chart);
                                break;
                            default:
                                if (colValue.group().size() == 1) {
                                    $('#chart' + val.name).parent().hide();
                                    return;
                                }
                                var colValueGroupCount = colValue.group();
                                var chart = dc.rowChart('#chart' + val.name);
                                chart.width($("#lod_data_panel").width() - 35)
                                    .height(colValueGroupCount.size() * 23 + 40).labelOffsetY(12)
                                    .dimension(colValue) // set dimension
                                    .group(colValueGroupCount) // set group
                                    .on("filtered", pie_filters_changed);
                                pies.push(chart);

                        };
                    });

                    dc.renderAll();
                    interval_chart.render();
                    range_chart.render();
                    $scope.loading = false;
                }

                $scope.$on('core.mainpanel_changed', function(event) {
                    if (Core.mainpanel == 'lodexplorer') {
                        $scope.data_panel_visible = true;
                        if (lyr == null) {
                            lyr = new ol.layer.Vector({
                                title: "Nuts regions",
                                source: new ol.source.GeoJSON({
                                    url: hsl_path + 'components/lodexplorer/nuts2.geojson'
                                }),
                                style: $scope.styleFunction
                            });
                        }
                        map.addLayer(lyr);
                    } else if (Core.mainpanel != 'info') {
                        map.removeLayer(lyr);
                        $scope.data_panel_visible = false;
                    }
                });

                $scope.closeDataPanel = function() {
                    $scope.data_panel_visible = false;
                }
                $scope.$emit('scope_loaded', "LodExplorer");
            }
        ]);

    })
