define(['angular', 'ol', 'dc', 'map', 'query', 'toolbar', 'drag'],

    function(angular, ol, dc) {
        var module = angular.module('hs.lodexplorer', ['drag', 'hs.map', 'hs.query', 'hs.toolbar'])
            .directive('lodExplorer', function() {
                return {
                    templateUrl: hsl_path + 'components/lodexplorer/partials/lodexplorer.html',
                    link: function(scope, element) {

                    }
                };
            }).service("SparqlLogService", [
                function() {
                    var me = {
                        logs: []
                    };
                    return me;
                }
            ]).directive('sparqlLogDialog', function() {
                return {
                    templateUrl: hsl_path + 'components/lodexplorer/partials/sparqllogdialog.html',
                };
            }).controller('SparqlLogDialog', ['$scope', 'SparqlLogService',
                function($scope, SparqlLogService) {
                    $scope.sparql_log = SparqlLogService.logs;
                }
            ])

        .controller('LodExplorer', ['$scope', 'OlMap', 'InfoPanelService', 'SparqlLogService', 'ToolbarService',
            function($scope, OlMap, InfoPanelService, SparqlLogService, ToolbarService) {
                var lyr = null;
                var map = OlMap.map;
                var magnitudeChart = dc.barChart("#dc-magnitude-chart");

                $scope.ajax_loader = hsl_path + 'components/lodexplorer/ajax-loader.gif';
                $scope.loading = false;
                $scope.sparql_log = [];
                $scope.sources = [{
                        url: "http://eurostat.linked-statistics.org/data/nama_r_e2gdp.rdf",
                        name: "Gross domestic product (GDP) at current market prices by NUTS 2 regions"
                    }, {
                        url: "http://eurostat.linked-statistics.org/data/demo_r_frate2.rdf",
                        name: "Fertility rates by age - NUTS 2 regions"
                    }, {
                        url: "http://eurostat.linked-statistics.org/data/demo_r_mlifexp.rdf",
                        name: "Life expectancy at given exact age (ex) - NUTS 2 regions"
                    }, {
                        url: "http://eurostat.linked-statistics.org/data/hlth_rs_prsrg.rdf",
                        name: "Health personnel by NUTS 2 regions"
                    }, {
                        url: "http://eurostat.linked-statistics.org/data/ef_kvftreg.rdf",
                        name: "Key variables: area, livestock (LSU), labour force and standard output (SO) by type of farming (2-digit)"
                    }



                ]
                $scope.groupings = [];

                var styleFunction = function(feature, resolution) {
                    if (Number.MIN_VALUE != feature.gradient_value) {
                        return [new ol.style.Style({
                            fill: new ol.style.Fill({
                                color: rainbow(1, feature.gradient_value, feature.opacity ? feature.opacity : 0),
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

                var rainbow = function(numOfSteps, step, opacity) {
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
                    var c = "rgba(" + ~~(r * 235) +"," + ~~(g * 235) + "," + ~~(b * 235) +", " + opacity +")";
                    return (c);
                }

                $scope.sourceChosen = function() {
                    var sparql = ["SELECT DISTINCT ?classif",
                        "FROM <" + $scope.source + ">",
                        "WHERE {",
                        "?s a <http://purl.org/linked-data/cube#Observation>;",
                        "    ?property ?classif .",
                        "FILTER(isIri(?classif) and ?property != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ",
                        "    and ?property != <http://purl.org/linked-data/cube#dataSet> ",
                        ")",
                        "}"
                    ].join("\n");
                    if (console) console.log(sparql);
                    var url = "http://ha.isaf2014.info:8890/sparql?default-graph-uri=&query=" + window.escape(sparql) + "&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on";
                    $scope.loading = true;
                    $.ajax({
                        url: url,
                        success: $scope.classifsDownloaded
                    });
                }

                $scope.classifsDownloaded = function(j) {
                    var unique_classifs = {};
                    var from_list = "";
                    for (var i = 0; i < j.results.bindings.length; i++) {
                        var part = j.results.bindings[i].classif.value.split("#")[0];
                        if (!(unique_classifs[part])) {
                            unique_classifs[part] = part;
                            from_list += "FROM <" + part + ">\n";
                        }
                    }
                    var sparql = ["SELECT DISTINCT ?property, ?value, str(?classificator) as ?classificator",
                        "FROM <" + $scope.source + ">",
                        from_list,
                        "WHERE {",
                        "?s a <http://purl.org/linked-data/cube#Observation>;",
                        "?property ?value .",
                        "OPTIONAL{?value skos:prefLabel ?classificator}.",
                        "FILTER(?property != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ",
                        "    and ?property != <http://purl.org/linked-data/cube#dataSet> ",
                        "    and ?property != <http://eurostat.linked-statistics.org/property#geo>",
                        "    and ?property != <http://purl.org/linked-data/sdmx/2009/measure#obsValue>",
                        ")",
                        "}"
                    ].join("\n");
                    if (console) console.log(sparql);
                    var url = "http://ha.isaf2014.info:8890/sparql?default-graph-uri=&query=" + window.escape(sparql) + "&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on";
                    $.ajax({
                        url: url,
                        success: $scope.propertiesDownloaded
                    });
                }

                $scope.propertiesDownloaded = function(j) {
                    var tmp = j.results.bindings;
                    var groups = {};
                    for (var i = 0; i < tmp.length; i++) {
                        var part = tmp[i].property.value.split("#")[1];
                        if (!(groups[part])) {
                            groups[part] = {
                                name: part,
                                property: tmp[i].property.value,
                                options: [],
                                datatype: tmp[i].value.datatype ? tmp[i].value.datatype : "url",
                                values: []
                            };
                        }
                        var value;
                        if (tmp[i].value.datatype && tmp[i].value.datatype == "http://www.w3.org/2001/XMLSchema#date") //Must strip +.. from value: "2001-01-01+02:00"
                            value = tmp[i].value.value.split("+")[0];
                        else
                            value = tmp[i].value.value;
                        if (tmp[i].classificator)
                            groups[part].options.push({
                                hr_name: tmp[i].classificator.value,
                                value: value
                            });
                        else
                            groups[part].options.push({
                                hr_name: value,
                                value: value
                            });
                    }
                    $scope.groupings = groups;
                    $scope.loading = false;
                    if (!$scope.$$phase) $scope.$digest();
                }

                $scope.display = function(j) {
                    var filter = "";
                    $scope.loading = true;
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
                            filter += " ?measurement <" + val.property + "> ?filter" + val.name + ". FILTER(?filter" + val.name + " = " + value + " ).";
                        }
                    });

                    var sparql = [
                        "PREFIX property: <http://eurostat.linked-statistics.org/property#>",
                        "PREFIX measure: <http://purl.org/linked-data/sdmx/2009/measure#>",
                        "SELECT DISTINCT str(?code) as ?code, (xsd:decimal(?value) as ?value)",
                        "FROM <" + $scope.source + ">",
                        "FROM <http://www.w3.org/2004/02/skos/core>",
                        "FROM <http://eurostat.linked-statistics.org/dic/geo.rdf>",
                        "FROM <http://eurostat.linked-statistics.org/dic/unit>",
                        "WHERE {",
                        "?measurement a <http://purl.org/linked-data/cube#Observation>;",
                        "measure:obsValue ?value;",
                        "property:geo ?location.",
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
                    var url = "http://ha.isaf2014.info:8890/sparql?default-graph-uri=&query=" + window.escape(sparql) + "&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on";
                    $.ajax({
                        url: url,
                        success: $scope.dataDownloaded
                    });
                }

                $scope.dataDownloaded = function(j) {
                    var dic = {};
                    var max = Number.MIN_VALUE;
                    var min = Number.MAX_VALUE;
                    var val;
                    var data = [];
                    for (var i = 0; i < j.results.bindings.length; i++) {
                        val = parseFloat(j.results.bindings[i].value.value);
                        var data_item = {};
                        dic[j.results.bindings[i].code.value] = {
                            value: parseFloat(val),
                            record: data_item
                        };
                        for (var property in j.results.bindings[i]) {
                            if (j.results.bindings[i].hasOwnProperty(property)) {
                                data_item[property] = j.results.bindings[i][property].value;
                            }
                        }
                        data.push(data_item);
                    }

                    var facts = crossfilter(data);
                    var magValue = facts.dimension(function(d) {
                        return d.value; // group or filter by magnitude
                    });

                    lyr.getSource().forEachFeature(function(feature) {
                        var dic_item = dic[feature.get('nuts_id')];
                        if (dic_item) {
                            val = dic_item.value;
                            //This is stored to highlight features which are selected in crossfilter chart.
                            dic_item.record.feature = feature;
                            feature.set('data_value', val);
                            feature.opacity = 0.9;
                            max = val > max ? val : max;
                            min = val < min ? val : min;
                        }
                    })
                    lyr.getSource().forEachFeature(function(feature) {
                        feature.gradient_value = dic[feature.get('nuts_id')] ? (dic[feature.get('nuts_id')].value - min) / (max - min) : Number.MIN_VALUE;
                    });

                    var magValueGroupCount = magValue.group().reduceCount(function(d) {
                        return d.value;

                    });
                    magnitudeChart.width($("#lod_data_panel").width()-15)
                        .height(130)
                        .margins({
                            top: 3,
                            right: 10,
                            bottom: 20,
                            left: 30
                        })
                        .dimension(magValue) // the values across the x axis
                        .group(magValueGroupCount) // the values on the y axis
                        .transitionDuration(500)
                        .centerBar(true)
                        .gap(56) // bar width Keep increasing to get right then back off.
                        .x(d3.scale.linear().domain([min, max]))
                        .elasticY(true).on("filtered", function(chart, filter) {
                            var data_items = magValue.top(Infinity);
                            lyr.getSource().forEachFeature(function(feature) {                     feature.opacity = 0.1;     });
                            data_items.forEach(function(key) {
                                if (key.feature) {
                                    key.feature.opacity = 0.9;
                                }
                            });
                            var features = lyr.getSource().getFeatures();
                            for (var i = 0; i < features.length; ++i) {
                                features[i].set('nuts_id', features[i].get('nuts_id'));
                            }
                        })
                        .xAxis().tickFormat(function(v) {
                            return v;
                        });
                    dc.renderAll();
                    $scope.loading = false;
                }

                $scope.$on('toolbar.mainpanel_changed', function(event) {
                    if (ToolbarService.mainpanel == 'lodexplorer') {
                        $scope.data_panel_visible = true;
                        if (lyr == null) {
                            lyr = new ol.layer.Vector({
                                title: "Nuts regions",
                                source: new ol.source.GeoJSON({
                                    url: hsl_path + 'components/lodexplorer/nuts2.geojson'
                                }),
                                style: styleFunction
                            });
                        }
                        map.addLayer(lyr);
                    } else if (ToolbarService.mainpanel != 'info') {
                        map.removeLayer(lyr);
                    }
                });

                $scope.closeDataPanel = function() {
                    console.log("te");
                }
            }
        ]);

    })
