/**
* @namespace hs.csv_importer
* @memberOf hs
* @desc Module is used to filter certain features on vector layers based on attribute values.
* It also draws nice charts with bars proportionaly to usage of each value of a particular attribute.
*
* must provide layers to be editable in app.js config parameters:
*      module.value('config', {
        editable_layer: 1,    // 1 means the index of layer in default_layers
        ...
*/
define(['angular', 'ol', 'angular-material', 'map', 'draw', 'layermanager', 'core', 'tabulator-tables'],

    function(angular, ol) {
        var module = angular.module('hs.csv_importer', ['hs.map', 'hs.core', 'hs.draw', 'ngMaterial', 'hs.layermanager'])


            /**
            * @memberof hs.csv_importer
            * @ngdoc directive
            * @name hs.attributeTable.directive
            * @description TODO
            */
            .directive('hs.attributeTable.directive', ['config', function(config) {
                return {
                    templateUrl: `${config.hsl_path}components/csv_importer/partials/csv_import_dialog${config.design || ''}.html`,
                    link: function(scope, element) {

                    }
                };
            }])

            .directive('fileReader', function($rootScope, config){
              return {
                scope: {
                  fileReader:"="
                },
                link: function(scope, element){
                  (element).on('change', function(changeEvent){
                    var files = changeEvent.target.files;
                    if (files.length){
                      var r = new FileReader();
                      r.onload = function(e){
                        var contents = e.target.result;
                        scope.$apply(function(){
                          scope.fileReader = contents;
                          scope.testing = contents;
                        });
                        loadJoiner(contents);
                      };
                      r.readAsText(files[0]);

                      function loadJoiner(csv){
                        csvRows = csv.split(/\r?\n|\r/);
                        addCSVHeader(csvRows[0]);
                        createFormOptions();
                      }

                      function addCSVHeader(line){
                        values = line.split(',');
                        for (var i=0; i<values.length; i++){
                          var option = document.createElement("option");
                          var optionValue = document.createTextNode(values[i]);
                          option.appendChild(optionValue);
                          $("#columnToAdd").append(option);
                          $("#innerJoinLeft").append($(option).clone());
                        }
                      }

                      function createFormOptions(){
                        var layer = config.default_layers[config.editable_layer];
                        var feature = layer.getSource().getFeatures()[0];
                        for (var key in feature.getProperties()){
                          if (key == "geometry") continue;
                          var option = document.createElement("option");
                          var optionValue = document.createTextNode(key);
                          option.appendChild(optionValue);
                          $("#innerJoinRight").append(option);
                        }
                      }

                    }
                  });
                }
              }})

            /**
            * @memberof hs.csv_importer
            * @ngdoc service
            * @name hs.csv_importer.service
            * @description TODO
            */
            .service('hs.csv_importer.service', ['$rootScope', 'hs.map.service', 'hs.layermanager.service', 'Core', 'hs.utils.service', 'config', 'hs.geolocation.service', function ($rootScope, OlMap, LayMan, Core, utils, config) {
                var me = {
                    /*  $scope.tableOptions = tableOptions;
                        var plotLayer =  new ol.layer.Vector({
                            title: "New Layer",
                            source: new ol.source.Vector,
                            style: style,
                            show_in_manager: false
                        });
                        plotLayer = source;


                        for (var i in filters) {
                            var filter = filters[i];
                            var displayFeature;

                            switch (filter.type.type) {
                                case 'fieldset':
                                    if (filter.selected.length === 0) {
                                        displayFeature = function (feature, filter) {
                                            return true;
                                        };
                                        break;
                                    }
                                    displayFeature = function (feature, filter) {
                                        return filter.selected.indexOf(feature.values_[filter.valueField]) !== -1;
                                    };
                                    break;
                                case 'slider':
                                    switch (filter.type.parameters) {
                                        case 'lt':
                                            displayFeature = function (feature, filter) {
                                                return feature.values_[filter.valueField] < filter.value;
                                            };
                                            break;
                                        case 'le':
                                            displayFeature = function (feature, filter) {
                                                return feature.values_[filter.valueField] <= filter.value;
                                            };
                                            break;
                                        case 'gt':
                                            displayFeature = function (feature, filter) {
                                                return feature.values_[filter.valueField] > filter.value;
                                            };
                                            break;
                                        case 'ge':
                                            displayFeature = function (feature, filter) {
                                                return feature.values_[filter.valueField] >= filter.value;
                                            };
                                            break;
                                        case 'eq':
                                            displayFeature = function (feature, filter) {
                                                return feature.values_[filter.valueField] === filter.value;
                                            };
                                            break;
                                    }
                                default:
                                    displayFeature = function (feature, filter) {
                                        return true;
                                    };
                            }

                            source.forEachFeature(function(feature) {
                                if (!displayFeature(feature, filter)) {
                                    feature.setStyle(new ol.style.Style({}));
                                } else {
                                    filteredFeatures.push(feature);
                                }
                            });
                        }

                    },*/

                    makeTable: function(layer){
                      /*var style = new ol.style.Style({
                          fill: new ol.style.Fill({
                              color: "rgba(108, 184, 222, 0)",
                          }),
                          stroke: new ol.style.Stroke({
                              color: '#430043',
                              width: 2
                          })
                      });*/

                      source = layer.getSource();
                      var plotFeatures = source.getFeatures();
                      createTable(plotFeatures);

                      function createTable(features){
                        $rootScope.$broadcast('data ready', {data: features});
                      }

                      //$rootScope.tableOptions.data = $rootScope.tableBody;
                      /*plotFeatures.forEach(function(feature){
                        var properties = feature.getProperties();
                      });*/

                      //$rootScope.tableApi.Core.refresh();

                    }
                };

                var layer = config.default_layers[config.editable_layer];
                $rootScope.layer = layer;
                var source = layer.getSource();
                var listenerKey = source.on('change', function (e) {
                    if (source.getState() === 'ready') {
                        console.log(source.getState());
                        me.makeTable(layer);
                        ol.Observable.unByKey(listenerKey);
                    }
                });
                return me;
            }])

            /**
            * @memberof hs.csv_importer
            * @ngdoc controller
            * @name hs.csv_importer.controller
            * @description TODO
            */
            .controller('hs.csv_importer.controller', ['$scope', 'hs.map.service', 'Core', 'hs.csv_importer.service', 'hs.layermanager.service', 'config',
                function($scope, OlMap, Core, service, LayMan, config, $rootScope) {
                    angular.extend($scope, $rootScope, {
                        /**
                         * @memberof hs.csv_importer.component
                         * @function add
                         */
                        add: function () {
                            var csvJoinedColumn = ($("#columnToAdd").val());
                            var csvJoinField = ($("#innerJoinLeft").val());
                            var tableJoinField = ($("#innerJoinRight").val());
                            var layer = config.default_layers[config.editable_layer];
                            var features = layer.getSource().getFeatures();
                            var csvTable = csvRows;
                            var newFeatures = joinCsvWithLayer(csvJoinedColumn, csvTable, features, csvJoinField, tableJoinField);
                            updateFeaturesToTable(newFeatures);
                        }
                    });

                    $scope.featuresToTable = function(features){
                      json = featuresToJson(features).features;
                      jsonToTabulator(json, features);
                    };
                    $scope.$on('data ready', function(e, data){
                      $scope.featuresToTable(data.data);
                    })

                    function updateFeaturesToTable(features){
                      json = featuresToJson(features);
                      /*table.clearData();
                      table = "";
                      $("#tableHead").html("");
                      HtmlTableHead(features);
                      $("#tableBody").html("");
                      HtmlTableBody(features);*/
                      setDataToTable(json.features);
                      //table.redraw(true);
                      //HtmlTableToTabulator(features);
                    }

                    function setDataToTable(json){
                      for (i=0; i<json.length; i++){
                        json[i].idx = i;
                      }
                      table.setData(json);
                      table.hideColumn("idx");
                    }

                    function featuresToJson(plotFeatures){
                      var f = "";
                      var properties = "";
                      var json = {
                        type: "FeatureCollection",
                        features: [],
                      };
                      plotFeatures.forEach(function(feature){
                        properties = feature.getProperties();
                        f = properties;
                        delete f.geometry;
                        json.features.push(f);
                      })
                      return json;
                    }

                    var Tabulator = require('tabulator-tables');
                    var table;

                    function jsonToTabulator(json, features){
                      table = new Tabulator("#htmlTable", {
                        autoColumns:true,
                        index: "idx",
                        layout:"fitData",
                        pagination:"local",
                        paginationSize:12,
                        paginationSizeSelector:[ 6, 12, 18, 24],
                        rowClick:function(e, row){
                          zoomToFeature(features[row.getIndex()]);
                        }
                      });
                      setDataToTable(json);

                      $("#addColumn").click(function(){
                        table.addColumn({title:"new-column", field:"new-column", editor:"input", editableTitle:true}, true );
                      });

                      //downloaders
                      $("#download-csv").click(function(){
                        table.download("csv", "data.csv");
                      });
                      $("#download-json").click(function(){
                        table.download("json", "data.json");
                      });
                      $("#download-xlsx").click(function(){
                          table.download("xlsx", "data.xlsx", {sheetName:"My Data"});
                      });
                      $("#download-pdf").click(function(){
                          table.download("pdf", "data.pdf", {
                              orientation:"portrait", //set page orientation to portrait
                              title:"Table export", //add title to report
                            });
                          });
                    }

                    /**
                    // functions for creating Tabulator table from HTML table
                    */

                    /*function HtmlTableHead(plotFeatures){
                      var rowNames = [];
                      for (var key in plotFeatures[0].getProperties()){
                        if (key == "geometry") continue;
                        var row = document.createElement("th");
                        var rowname = document.createTextNode(key);
                        row.appendChild(rowname);
                        $("#tableHead").append(row);
                        rowNames.push(key);
                      };
                    }

                    function HtmlTableBody(plotFeatures){
                      plotFeatures.forEach(function(feature){
                        var properties = feature.getProperties();
                        var row = document.createElement("tr");
                        for (var key in properties){
                          if (key == "geometry") continue;
                          var record = document.createElement("td");
                          var recordname = document.createTextNode(properties[key]);
                          record.appendChild(recordname);
                          row.appendChild(record);
                        }
                        $("#tableBody").append(row);
                      });
                    }

                    function HtmlTableToTabulator(features){
                      table = "";
                      //var Tabulator = require('tabulator-tables');
                      //var table = new Tabulator("#htmlTable", {
                      table = new Tabulator("#htmlTable", {
                        //height:405, // set height of table (optional)
                        layout:"fitData",
                        pagination:"local",
                        paginationSize:12,
                        paginationSizeSelector:[ 6, 12, 18, 24],
                        rowClick:function(e, row){
                          zoomToFeature(features[row.getIndex()]);
                        }
                      });

                      $("#addColumn").click(function(){
                        table.addColumn({title:"new-column", field:"new-column", editor:"input", editableTitle:true}, true );
                      });

                      //downloaders
                      $("#download-csv").click(function(){
                        table.download("csv", "data.csv");
                      });
                      //trigger download of data.json file
                      $("#download-json").click(function(){
                        table.download("json", "data.json");
                      });
                      //trigger download of data.xlsx file
                      $("#download-xlsx").click(function(){
                          table.download("xlsx", "data.xlsx", {sheetName:"My Data"});
                      });
                      //trigger download of data.pdf file
                      $("#download-pdf").click(function(){
                          table.download("pdf", "data.pdf", {
                              orientation:"portrait", //set page orientation to portrait
                              title:"Table export", //add title to report
                            });
                          });
                    }*/

                    /**
                     * @function zoomToFeature
                     * @memberOf hs.draw.controller
                     * @param {Ol.feature} olf Feature to zoom to
                     * (PRIVATE) Zoom to selected feature (center for point, fit view for other types)
                     */
                    function zoomToFeature(olf) {
                        var map = OlMap.map;
                        if (olf.getGeometry().getType() == 'Point') {
                            map.getView().setCenter(olf.getGeometry().getCoordinates());
                        } else {
                            map.getView().fit(olf.getGeometry(), map.getSize(), {duration: 1000});
                        }
                    }

                    function featuresToTabulator(features){
                      table = new Tabulator("#htmlTable2", {
                        //height:405, // set height of table (optional)
                        data: features,
                        layout:"fitData",
                        pagination:"local",
                        paginationSize:12,
                        paginationSizeSelector:[ 6, 12, 18, 24],
                        rowClick:function(e, row){
                          feature = features[row.getIndex()];
                          zoomToFeature(features[row.getIndex()]);
                        }
                      });
                      //table.setData(features);
                    }

                    $scope.map = OlMap.map;
                    $scope.LayMan = LayMan;
                    var layer;
                    layer = LayMan.currentLayer;

                    function joinCsvWithLayer(csvJoinedColumn, csvTable, features, csvField, tableField){
                      var newFeatures = features;
                      //console.log("joining column " + csvJoinedColumn + " according to fields " + csvField + " and " + tableField);
                      var csvJoinedColumnNum = ($("#columnToAdd").prop("selectedIndex"));
                      var csvDict = csvToDictionary(csvRows, 0, csvJoinedColumnNum);
                      //console.log("1st features " + tableField + " is " + newFeatures[0].getProperties()[tableField]);
                      newFeatures.forEach(function(feature){
                        var num = feature.getProperties()[tableField];
                        var key = '"' + num + '"';
                        feature.set(csvJoinedColumn, csvDict[key]);
                      });
                      return newFeatures;

                      function csvToDictionary(csvRows, csvField, csvJoinedColumnNum){
                        var dict = {};
                        for(var row = 1; row < csvRows.length; row ++){
                          values = csvRows[row].split(',');
                          dict[values[csvField]] = values[csvJoinedColumnNum];
                        }
                        return dict;
                      };

                    };

                }
            ])

    });
