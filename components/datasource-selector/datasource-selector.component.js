import './layman/layman.service';

export default {
  template: require('./partials/datasource_selector.html'),
  controller: [
    '$scope',
    'Core',
    '$compile',
    'hs.utils.service',
    '$http',
    'hs.datasourceBrowserService',
    'config',
    'hs.laymanBrowserService',
    'hs.layout.service',
    '$injector',
    'hs.common.endpointsService',
    'hs.datasourceSelector.mapService',
    function (
      $scope,
      Core,
      $compile,
      utils,
      $http,
      datasourceSelectorService,
      config,
      laymanService,
      layoutService,
      $injector,
      endpointsService,
      mapService
    ) {
      $scope.Core = Core;
      $scope.data = datasourceSelectorService.data;
      $scope.DS = datasourceSelectorService;
      $scope.mapService = mapService;
      $scope.config = config;
      $scope.advancedSearch = false;
      $scope.endpointsService = endpointsService;

      $scope.$on('ows.wms_connecting', () => {
        $scope.data.wms_connecting = true;
      });

      /**
       * @function getPreviousRecords
       * @memberOf hs.datasource_selector
       * @param {Object} endpoint Selected datasource
       * Loads previous records of datasets from selected datasource (based on number of results per page and current start)
       */
      $scope.getPreviousRecords = function (endpoint) {
        const paging = endpoint.datasourcePaging;
        const itemsPerPage = endpoint.paging.itemsPerPage;
        if (paging.start - itemsPerPage < 0) {
          paging.start = 0;
          paging.next = itemsPerPage;
        } else {
          paging.start -= itemsPerPage;
          paging.next = paging.start + itemsPerPage;
        }
        datasourceSelectorService.queryCatalog(endpoint);
      };

      /**
       * @function getNextRecords
       * @memberOf hs.datasource_selector
       * @param {Object} endpoint Selected datasource
       * Loads next records of datasets from selected datasource (based on number of results per page and current start)
       */
      $scope.getNextRecords = function (endpoint) {
        const paging = endpoint.datasourcePaging;
        const itemsPerPage = endpoint.paging.itemsPerPage;
        if (paging.next != 0) {
          paging.start = Math.floor(paging.next / itemsPerPage) * itemsPerPage;
          if (paging.next + itemsPerPage > paging.matched) {
            paging.next = paging.matched;
          } else {
            paging.next += itemsPerPage;
          }
          datasourceSelectorService.queryCatalog(endpoint);
        }
      };

      /**
       * @function showMetadata
       * @memberOf hs.datasource_selector
       * @param {Object} endpoint Datasource of selected layer
       * @param {Object} layer Metadata record of selected layer
       * @param {Object} e
       * Show metadata record dialog window for selected layer.
       */
      $scope.showMetadata = function (endpoint, layer) {
        $scope.selected_layer = layer;
        $scope.selected_ds = endpoint;
        let filler = Promise.resolve();

        if (endpoint.type == 'layman') {
          filler = laymanService.fillLayerMetadata(endpoint, layer);
        }
        filler.then(() => {
          $scope.metadata = decomposeMetadata(layer);
          if (config.design === 'md') {
            metadataDialog();
          } else {
            const previousDialog = layoutService.contentWrapper.querySelector(
              '.hs-datasource_selector-metadata-dialog'
            );
            if (previousDialog) {
              previousDialog.parentNode.removeChild(previousDialog);
            }
            const el = angular.element(
              '<div hs.datasource_selector.metadata_dialog_directive></span>'
            );
            layoutService.contentWrapper
              .querySelector('.hs-dialog-area')
              .appendChild(el[0]);
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
            },
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
    },
  ],
};
