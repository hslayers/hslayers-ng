import './layman/layman.service';

export default {
  template: require('./partials/datasource_selector.html'),
  controller:
    ['$scope', 'Core', '$compile', 'hs.utils.service', '$http', 'hs.datasourceBrowserService', 'config', 'hs.laymanBrowserService', 'hs.layout.service', '$injector', 'hs.common.endpointsService',
      function ($scope, Core, $compile, utils, $http, datasourceSelectorService, config, laymanService, layoutService, $injector, endpointsService) {
        $scope.Core = Core;
        $scope.data = datasourceSelectorService.data;
        $scope.DS = datasourceSelectorService;
        datasourceSelectorService.paging = $scope.data.paging;
        $scope.config = config;
        $scope.advancedSearch = false;
        $scope.endpointsService = endpointsService;

        $scope.$on('ows.wms_connecting', () => {
          $scope.data.wms_connecting = true;
        });

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
        };

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
        };

        /**
         * @function showMetadata
         * @memberOf hs.datasource_selector
         * @param {Object} ds Datasource of selected layer
         * @param {Object} layer Metadata record of selected layer
         * @param {Object} e
         * Show metadata record dialog window for selected layer.
         */
        $scope.showMetadata = function (ds, layer) {
          $scope.selected_layer = layer;
          $scope.selected_ds = ds;
          let filler = Promise.resolve();

          if (ds.type == 'layman') {
            filler = laymanService.fillLayerMetadata(ds, layer);
          }
          filler.then(() => {
            $scope.metadata = decomposeMetadata(layer);
            if (config.design === 'md') {
              metadataDialog();
            } else {
              const previousDialog = layoutService.contentWrapper.querySelector('.hs-datasource_selector-metadata-dialog');
              if (previousDialog) {
                previousDialog.parentNode.removeChild(previousDialog);
              }
              const el = angular.element('<div hs.datasource_selector.metadata_dialog_directive></span>');
              layoutService.contentWrapper.querySelector('.hs-dialog-area').appendChild(el[0]);
              $compile(el)($scope);
            }
          });
        };

        function decomposeMetadata(input, prestring) {
          if (angular.isObject(input)) {
            return decomposeObject(input, prestring);
          } else if (angular.isArray(input)) {
            return decomposeArray(input, prestring);
          }
        }

        function decomposeObject(obj, substring) {
          const decomposed = {};
          let subvalue = undefined;
          angular.forEach(obj, (value, key) => {
            if (key == 'feature') {
              return;
            }
            let newstring = '';
            if (angular.isDefined(substring)) {
              newstring = substring + ' - ' + key;
            } else {
              newstring = key;
            }
            if (angular.isObject(value)) {
              subvalue = decomposeObject(value, newstring);
            } else if (angular.isArray(value)) {
              subvalue = decomposeArray(value, newstring);
            } else {
              subvalue = value;
            }
            if (angular.isObject(subvalue)) {
              angular.merge(decomposed, subvalue);
            } else {
              decomposed[newstring] = subvalue;
            }
          });
          return decomposed;
        }

        function decomposeArray(arr, substring) {
          const decomposed = undefined;
          let sub = undefined;
          angular.forEach(arr, (value) => {
            if (angular.isObject(value)) {
              sub = decomposeObject(value, substring);
            } else if (angular.isArray(value)) {
              sub = decomposeArray(value, substring);
            } else {
              sub += value;
            }
            if (angular.isObject(sub)) {
              angular.merge(decomposed, sub);
            } else {
              decomposed[substring] = sub;
            }
          });
          return decomposed;
        }

        function metadataDialog() {
          try {
            const $mdDialog = $injector.get('$mdDialog');

            $mdDialog.show({
              parent: angular.element('#hsContainer'),
              clickOutsideToClose: true,
              escapeToClose: true,
              scope: $scope,
              preserveScope: true,
              template: require('./partials/datasourceBrowserMetadata.html'),
              controller: function DialogController($scope, $mdDialog) {
                $scope.closeDialog = function () {
                  $mdDialog.hide();
                };
              }
            });
          } catch (ex) {
            // continue regardless of error
          }
        }

        /**
         * @function addLayerToMap
         * @memberOf hs.datasource_selector
         * @param {Object} ds Datasource of selected layer
         * @param {Object} layer Metadata record of selected layer
         * Add selected layer to map (into layer manager) if possible (supported formats: WMS, WFS, Sparql, kml, geojson, json)
         */
        $scope.addLayerToMap = function (ds, layer) {
          datasourceSelectorService.addLayerToMap(ds, layer);
          $scope.metadataModalVisible = false;
        };

        $scope.datasetSelect = datasourceSelectorService.datasetSelect;

        $scope.$emit('scope_loaded', 'DatasourceSelector');
      }
    ]
};
