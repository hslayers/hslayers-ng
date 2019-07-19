export default {
    template: require('components/datasource-selector/partials/datasource_selector.html'),
    controller:
        ['$scope', 'Core', '$compile', 'hs.utils.service', '$http', 'hs.datasource_selector.service', 'config',
            function ($scope, Core, $compile, utils, $http, DS, config) {
                $scope.Core = Core;
                $scope.data = DS.data;
                $scope.DS = DS;
                $scope.dsPaging = $scope.data.paging;
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

                if (config.datasources && config.datasources.length > 0)
                    $http({
                        method: 'GET',
                        url: utils.proxify('http://opentransportnet.eu:8082/api/3/action/vocabulary_show?id=36c07014-c461-4f19-b4dc-a38106144e66')
                    }).then(function successCallback(response) {
                        $scope.otn_keywords = [{ title: '-' }];
                        angular.forEach(response.data.result.tags, function (tag) {
                            $scope.otn_keywords.push({ title: tag.name });
                        })
                    });

                /**
                 * @function openMickaAdvancedSearch
                 * @memberOf hs.datasource_selector
                 * Opens Micka Advanced Search dialog, might pass current search string.
                 */
                $scope.openMickaAdvancedSearch = function () {
                    if (document.getElementById('ds-advanced-micka') == null) {
                        var el = angular.element('<div hs.datasource_selector.advanced_micka_dialog_directive></div>');
                        $compile(el)($scope);
                        document.getElementById("hs-dialog-area").appendChild(el[0]);
                    } else {
                        $scope.modalVisible = true;
                    }
                    DS.checkAdvancedMicka();
                }

                /**
                 * @function showSuggestions
                 * @memberOf hs.datasource_selector
                 * @param {String} input Suggestion class type name (e.g. "Organisation Name")
                 * @param {String} param Suggestion paramater of Micka service (e.g. "org")
                 * @param {String} field Expected property name in response object (e.g. "value")
                 * Shows suggestions dialog and edits suggestion config.
                 */
                $scope.showSuggestions = function (input, param, field) {
                    DS.changeSuggestionConfig(input, param, field);
                    if (config.design === "md") {
                        DS.checkAdvancedMicka();
                        $scope.data.suggestionFilter = $scope.data.query[input];
                        DS.suggestionFilterChanged();
                    } else {
                        if (document.getElementById('ds-suggestions-micka') == null) {
                            var el = angular.element('<div hs.datasource_selector.suggestions_dialog_directive></span>');
                            document.getElementById("hs-dialog-area").appendChild(el[0]);;
                            $compile(el)($scope);
                        } else {
                            $scope.suggestionsModalVisible = true;
                            var filterElement = document.getElementById('ds-sug-filter');
                            $scope.data.suggestionFilter = $scope.data.query[input];
                            filterElement.focus();
                            DS.suggestionFilterChanged();
                        }
                    }
                }

                /**
                 * @function getPreviousRecords
                 * @memberOf hs.datasource_selector
                 * @param {Object} ds Selected datasource
                 * Loads previous records of datasets from selected datasource (based on number of results per page and current start)
                 */
                $scope.getPreviousRecords = function (ds) {
                    if (ds.start - $scope.data.dsPaging < 0) {
                        ds.start = 0;
                        ds.next = $scope.data.dsPaging;
                    } else {
                        ds.start -= $scope.data.dsPaging;
                        ds.next = ds.start + $scope.data.dsPaging;
                    }
                    DS.loadDataset(ds);
                }

                /**
                 * @function getNextRecords
                 * @memberOf hs.datasource_selector
                 * @param {Object} ds Selected datasource
                 * Loads next records of datasets from selected datasource (based on number of results per page and current start)
                 */
                $scope.getNextRecords = function (ds) {
                    if (ds.next != 0) {
                        ds.start = Math.floor(ds.next / $scope.data.dsPaging) * $scope.data.dsPaging;

                        if (ds.next + $scope.data.dsPaging > ds.matched) {
                            ds.next = ds.matched;
                        } else {
                            ds.next += $scope.data.dsPaging;
                        }
                        DS.loadDataset(ds);
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
                        if (!$scope.$$phase) $scope.$digest();
                        var previousDialog = document.getElementById("datasource_selector-metadata-dialog");
                        if (previousDialog)
                            previousDialog.parentNode.removeChild(previousDialog);
                        var el = angular.element('<div hs.datasource_selector.metadata_dialog_directive></span>');
                        document.getElementById("hs-dialog-area").appendChild(el[0]);
                        $compile(el)($scope);
                    }
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
                    var result = DS.addLayerToMap(ds, layer);
                    if (result == "WMS") {
                        if (Core.singleDatasources) {
                            $('.dss-tabs a[href="#OWS"]').tab('show')
                        } else {
                            Core.setMainPanel('ows');
                        }
                        var link = layer.link;
                        hslayers_api.gui.Ows.setUrlAndConnect(decodeURIComponent(link), 'WMS');
                    }
                    else if (result == "WFS") {
                        if (Core.singleDatasources) {
                            $('.dss-tabs a[href="#OWS"]').tab('show')
                        } else {
                            Core.setMainPanel('ows');
                        }
                        var link = layer.link;
                        hslayers_api.gui.Ows.setUrlAndConnect(decodeURIComponent(link), 'WFS');
                    }
                    else {
                        Core.setMainPanel('layermanager');
                    }
                    $scope.metadataModalVisible = false;
                }

                /**
                 * @function setOtnKeyword
                 * @memberOf hs.datasource_selector
                 * @param {String} theme Selected Otn theme keyword 
                 * Select Otn Keyword as query subject (used with dropdown list in Gui)
                 */
                $scope.setOtnKeyword = function (theme) {
                    if (theme == '-') theme = '';
                    $scope.query.Subject = theme;
                    DS.loadDatasets(DS.datasources);
                    return false;
                }

                $scope.$emit('scope_loaded', "DatasourceSelector");
            }
        ]
}