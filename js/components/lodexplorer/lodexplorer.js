angular.module('hs.lodexplorer', ['hs.map', 'hs.query'])
    .directive('lodExplorer', function() {
        return {
            templateUrl: 'js/components/lodexplorer/partials/lodexplorer.html'
        };
    })

.controller('LodExplorer', ['$scope', 'OlMap', '$http', 'InfoPanelService',
    function($scope, OlMap, $http, InfoPanelService) {
        var map = OlMap.map;
        $scope.loading = false;
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
        }]
        $scope.groupings = [];

        var styleFunction = function(feature, resolution) {
            return [new ol.style.Style({
                fill: new ol.style.Fill({
                    color: [0x33, 0x99, 0xff, feature.opacity]
                }),
                stroke: new ol.style.Stroke({
                    color: '#3399FF'
                })
            })]
        }

        var lyr = new ol.layer.Vector({
            title: "Nuts regions",
            source: new ol.source.GeoJSON({
                url: 'js/components/lodexplorer/nuts2.geojson'
            }),
            style: styleFunction
        });
        map.addLayer(lyr);

        var selector = new ol.interaction.Select({
            condition: ol.events.condition.click
        });

        selector.getFeatures().on('add', function(e) {
            var attributes = [{
                name: "Nuts ID",
                value: e.element.get("nuts_id")
            }, {
                name: "Name",
                value: e.element.get("name_original")
            }];
            if (e.element.get("data_value"))
                attributes.push({
                    name: "Value",
                    value: e.element.get("data_value")
                });
            InfoPanelService.setAttributes(attributes);
        });
        map.addInteraction(selector);


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
            $http.get(url).success($scope.classifsDownloaded);
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
                "    ?property ?value .",
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
            $http.get(url).success($scope.propertiesDownloaded);
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
            var url = "http://ha.isaf2014.info:8890/sparql?default-graph-uri=&query=" + window.escape(sparql) + "&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on";
            $http.get(url).success(this.dataDownloaded);
        }

        $scope.dataDownloaded = function(j) {
            var dic = {};
            var max = Number.MIN_VALUE;
            var min = Number.MAX_VALUE;
            var val;
            for (var i = 0; i < j.results.bindings.length; i++) {
                val = parseFloat(j.results.bindings[i].value.value);
                dic[j.results.bindings[i].code.value] = val;

            }
            lyr.source_.forEachFeature(function(feature) {
                val = dic[feature.values_.nuts_id]
                feature.values_.data_value = val;
                max = val > max ? val : max;
                min = val < min ? val : min;
            })
            min -= (max - min) * 0.2;
            lyr.source_.forEachFeature(function(feature) {
                feature.opacity = dic[feature.values_.nuts_id] ? (dic[feature.values_.nuts_id] - min) / (max - min) : 0;
            })
            lyr.dispatchChangeEvent();
            $scope.loading = false;
        }
    }
]);

//