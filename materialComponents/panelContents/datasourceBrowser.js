/**
 * @namespace hs.material.search
 * @memberOf hs
 */
define(['angular', 'ol', 'angular-material'],

    function (angular, ol, ngMaterial) {
        angular.module('hs.material.datasourceBrowser', ['ngMaterial'])

            .directive('hs.material.datasourcebrowser.directive', function () {
                return {
                    templateUrl: hsl_path + 'materialComponents/panelContents/datasourceBrowser.html?bust=' + gitsha,
                    link: function (scope, element) {

                    }
                };
            })
            .controller('hs.material.datasourcebrowser.controller', ['$scope', 'Core', '$compile', 'hs.utils.service', '$http', 'hs.datasource_selector.service', 'config', '$mdDialog', function($scope, Core, $compile, utils, $http, DS, config, $mdDialog){
                $scope.data = DS.data;
                $scope.DS = DS;
                $scope.paging = $scope.data.paging;
                $scope.config = config;
                $scope.advancedSearch = false;
                if (angular.isDefined($scope.data.datasets) && $scope.data.datasets.length > 0) {
                    $scope.selectedDS = $scope.data.datasets[0];
                }
                $scope.$watch(
                    "data.datasets",
                    function( newValue, oldValue ) {
                        if (angular.isDefined($scope.data.datasets) && $scope.data.datasets.length > 0) {
                            $scope.selectedDS = $scope.data.datasets[0];
                        }
                    }
                );
                if(config.datasources && config.datasources.length > 0)
                    $http({
                        method: 'GET',
                        url: utils.proxify('http://opentransportnet.eu:8082/api/3/action/vocabulary_show?id=36c07014-c461-4f19-b4dc-a38106144e66')
                    }).then(function successCallback(response) {
                        $scope.otn_keywords = [{ title: '-' }];
                        angular.forEach(response.data.result.tags, function (tag) {
                            $scope.otn_keywords.push({ title: tag.name });
                        })
                    });

                $scope.changeDS = function(dataset){
                    $scope.selectedDS = dataset;
                }

                $scope.expandSearch = function(expand){
                    $scope.advancedSearch = expand;
                    console.log($scope.data);
                    console.log($scope.selectedDS);
                }

                /**
                 * @function showSuggestions
                 * @memberOf hs.datasource_selector.controller
                 * @param {String} input Suggestion class type name (e.g. "Organisation Name")
                 * @param {String} param Suggestion paramater of Micka service (e.g. "org")
                 * @param {String} field Expected property name in response object (e.g. "value")
                 * Shows suggestions dialog and edits suggestion config.
                 */
                $scope.showSuggestions = function (input, param, field) {
                    DS.changeSuggestionConfig(input, param, field);
                    DS.checkAdvancedMicka();
                    $scope.data.suggestionFilter = $scope.data.query[input];
                    DS.suggestionFilterChanged();
                }

                /**
                 * @function getPreviousRecords
                 * @memberOf hs.datasource_selector.controller
                 * @param {Object} ds Selected datasource
                 * Loads previous records of datasets from selected datasource (based on number of results per page and current start)
                 */
                $scope.getPreviousRecords = function (ds) {
                    if (ds.start - $scope.data.paging < 0) {
                        ds.start = 0;
                        ds.next = $scope.data.paging;
                    } else {
                        ds.start -= $scope.data.paging;
                        ds.next = ds.start + $scope.data.paging;
                    }
                    DS.loadDataset(ds);
                }

                /**
                 * @function getNextRecords
                 * @memberOf hs.datasource_selector.controller
                 * @param {Object} ds Selected datasource
                 * Loads next records of datasets from selected datasource (based on number of results per page and current start)
                 */
                $scope.getNextRecords = function (ds) {
                    if (ds.next != 0) {
                        ds.start = Math.floor(ds.next / $scope.data.paging) * $scope.data.paging;

                        if (ds.next + $scope.data.paging > ds.matched) {
                            ds.next = ds.matched;
                        } else {
                            ds.next += $scope.data.paging;
                        }
                        DS.loadDataset(ds);
                    }
                }

                /**
                 * @function showMetadata
                 * @memberOf hs.datasource_selector.controller
                 * @param {Object} ds Datasource of selected layer
                 * @param {Object} layer Metadata record of selected layer
                 * Show metadata record dialog window for selected layer.
                 */
                $scope.showMetadata = function (layer, e) {
                    $scope.selectedLayer = layer;
                    $scope.metadata = decomposeMetadata(layer);
                    metadataDialog(e);
                }

                function metadataDialog($event) {
                    $mdDialog.show({
                        parent: angular.element('#hsContainer'),
                        targetEvent: $event,
                        clickOutsideToClose: true,
                        escapeToClose: true,
                        scope: $scope,
                        preserveScope: true,  
                        templateUrl: hsl_path + 'materialComponents/panelContents/datasourceBrowserMetadata.html',
                        controller: function DialogController($scope, $mdDialog) {
                            $scope.closeDialog = function () {
                                $mdDialog.hide();
                            }
                        }
                    });
                }

                /**
                 * @function addLayerToMap
                 * @memberOf hs.datasource_selector.controller
                 * @param {Object} ds Datasource of selected layer
                 * @param {Object} layer Metadata record of selected layer
                 * Add selected layer to map (into layer manager) if possible (supported formats: WMS, WFS, Sparql, kml, geojson, json)
                 */
                $scope.addLayerToMap = function (ds, layer) {
                    var result = DS.addLayerToMap(ds, layer);
                    if (result == "WMS") {
                        //
                    }
                    else if (result == "WFS") {
                        //
                    }
                    else {
                        Core.setMainPanel('layermanager');
                    }
                    console.log(result);
                }

                $scope.reload = function(){
                    DS.loadDataset($scope.selectedDS);
                }

                $scope.isIteratable = function (obj) {
                    return typeof obj == 'object'
                };

                function decomposeMetadata(input, prestring){
                    if (angular.isObject(input)) return decomposeObject(input, prestring);
                    else if (angular.isArray(input)) return decomposeArray(input, prestring);
                }

                function decomposeObject(obj, substring) {
                    var decomposed = {};
                    var subvalue = undefined;
                    angular.forEach(obj, function(value,key){
                        if (key == "feature") return;
                        var newstring = '';
                        if (angular.isDefined(substring)) newstring = substring + ' - ' + key;
                        else newstring = key;
                        if (angular.isObject(value)) subvalue = decomposeObject(value, newstring);
                        else if (angular.isArray(value)) subvalue = decomposeArray(value, newstring);
                        else subvalue = value;
                        if (angular.isObject(subvalue)) angular.merge(decomposed, subvalue)
                        else decomposed[newstring] = subvalue;
                    });
                    return decomposed;
                }

                function decomposeArray(arr, substring) {
                    var decomposed = undefined;
                    var sub = undefined;
                    angular.forEach(arr, function(value){
                        if (angular.isObject(value)) sub = decomposeObject(value, substring);
                        else if (angular.isArray(value)) sub = decomposeArray(value, substring);
                        else sub += value;
                        if (angular.isObject(sub)) angular.merge(decomposed, sub)
                        else decomposed[substring] = sub;
                    });
                    return decomposed;
                }

                $scope.$emit('scope_loaded', "DatasourceSelector");
            }])
        
})