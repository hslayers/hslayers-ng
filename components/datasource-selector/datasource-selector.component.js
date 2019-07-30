export default {
    template: require('./partials/datasource_selector.html'),
    controller:
        ['$scope', 'Core', '$compile', 'hs.utils.service', '$http', 'hs.datasourceBrowserService', 'config', '$rootScope', '$timeout',
            function ($scope, Core, $compile, utils, $http, datasourceSelectorService, config, $rootScope, $timeout) {
                $scope.Core = Core;
                $scope.data = datasourceSelectorService.data;
                $scope.DS = datasourceSelectorService;
                datasourceSelectorService.paging = $scope.data.paging;
                $scope.wms_connecting = false;
                $scope.config = config;
                $scope.advancedSearch = false;
                $scope.id_selected = Core.exists('hs.addLayers') ? 'OWS' : '';

                $scope.$on('ows.wms_connecting', function () {
                    $scope.wms_connecting = true;
                });

                $scope.datasetSelect = function (id_selected) {
                    $scope.wms_connecting = false;
                    $scope.id_selected = id_selected;
                }

                /**
                 * @function getPreviousRecords
                 * @memberOf hs.datasource_selector
                 * @param {Object} ds Selected datasource
                 * Loads previous records of datasets from selected datasource (based on number of results per page and current start)
                 */
                $scope.getPreviousRecords = function (ds) {
                    if (ds.start - datasourceSelectorService.paging < 0) {
                        ds.start = 0;
                        ds.next = datasourceSelectorService.paging;
                    } else {
                        ds.start -= datasourceSelectorService.paging;
                        ds.next = ds.start + datasourceSelectorService.paging;
                    }
                    datasourceSelectorService.queryCatalog(ds);
                }

                /**
                 * @function getNextRecords
                 * @memberOf hs.datasource_selector
                 * @param {Object} ds Selected datasource
                 * Loads next records of datasets from selected datasource (based on number of results per page and current start)
                 */
                $scope.getNextRecords = function (ds) {
                    if (ds.next != 0) {
                        ds.start = Math.floor(ds.next / datasourceSelectorService.paging) * datasourceSelectorService.paging;

                        if (ds.next + datasourceSelectorService.paging > ds.matched) {
                            ds.next = ds.matched;
                        } else {
                            ds.next += datasourceSelectorService.paging;
                        }
                        datasourceSelectorService.queryCatalog(ds);
                    }
                }

                /**
                 * @function showMetadata
                 * @memberOf hs.datasource_selector
                 * @param {Object} ds Datasource of selected layer
                 * @param {Object} layer Metadata record of selected layer
                 * Show metadata record dialog window for selected layer.
                 */
                $scope.showMetadata = function (ds, layer, e) {
                    $scope.selected_layer = layer;
                    $scope.selected_ds = ds;
                    $scope.metadata = decomposeMetadata(layer);
                    if (config.design === "md") {
                        metadataDialog(e);
                    } else {
                        var previousDialog = document.getElementById("datasource_selector-metadata-dialog");
                        if (previousDialog)
                            previousDialog.parentNode.removeChild(previousDialog);
                        var el = angular.element('<div hs.datasource_selector.metadata_dialog_directive></span>');
                        document.getElementById("hs-dialog-area").appendChild(el[0]);
                        $compile(el)($scope);
                    }
                }

                function decomposeMetadata(input, prestring) {
                    if (angular.isObject(input)) return decomposeObject(input, prestring);
                    else if (angular.isArray(input)) return decomposeArray(input, prestring);
                }

                function decomposeObject(obj, substring) {
                    var decomposed = {};
                    var subvalue = undefined;
                    angular.forEach(obj, function (value, key) {
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
                    angular.forEach(arr, function (value) {
                        if (angular.isObject(value)) sub = decomposeObject(value, substring);
                        else if (angular.isArray(value)) sub = decomposeArray(value, substring);
                        else sub += value;
                        if (angular.isObject(sub)) angular.merge(decomposed, sub)
                        else decomposed[substring] = sub;
                    });
                    return decomposed;
                }

                function metadataDialog($event) {
                    try {
                        var $mdDialog = $injector.get('$mdDialog');

                        $mdDialog.show({
                            parent: angular.element('#hsContainer'),
                            targetEvent: $event,
                            clickOutsideToClose: true,
                            escapeToClose: true,
                            scope: $scope,
                            preserveScope: true,
                            template: require('materialComponents/panelContents/datasourceBrowserMetadata.html'),
                            controller: function DialogController($scope, $mdDialog) {
                                $scope.closeDialog = function () {
                                    $mdDialog.hide();
                                }
                            }
                        });
                    } catch (ex) { }
                }

                /**
                 * @function addLayerToMap
                 * @memberOf hs.datasource_selector
                 * @param {Object} ds Datasource of selected layer
                 * @param {Object} layer Metadata record of selected layer
                 * Add selected layer to map (into layer manager) if possible (supported formats: WMS, WFS, Sparql, kml, geojson, json)
                 */
                $scope.addLayerToMap = function (ds, layer) {
                    var result = datasourceSelectorService.addLayerToMap(ds, layer);
                    if (result == "WMS" || result == "WFS") {
                        if (Core.singleDatasources) {
                            $scope.datasetSelect('OWS')
                        } else {
                            Core.setMainPanel('ows');
                        }
                        var link = layer.link;
                        $timeout(() => {
                            $rootScope.$broadcast(`ows.filling`, result.toLowerCase(), decodeURIComponent(link));
                        })
                    }
                    else {
                        Core.setMainPanel('layermanager');
                    }
                    $scope.metadataModalVisible = false;
                }

                $scope.$emit('scope_loaded', "DatasourceSelector");
            }
        ]
}