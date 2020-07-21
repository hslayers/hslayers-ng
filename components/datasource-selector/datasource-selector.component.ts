import './layman/layman.service';
import * as angular from 'angular';

export const HsDatasourcesComponent = {
  template: require('./partials/datasource_selector.html'),
  controller: function (
    $scope,
    HsCore,
    $compile,
    HsDatasourceBrowserService,
    HsConfig,
    HsLaymanBrowserService,
    HsLayoutService,
    $injector,
    HsCommonEndpointsService,
    HsDataSourceSelectorMapService,
    HsUtilsService
  ) {
    'ngInject';
    $scope.HsCore = HsCore;
    $scope.data = HsDatasourceBrowserService.data;
    $scope.DS = HsDatasourceBrowserService;
    $scope.mapService = HsDataSourceSelectorMapService;
    $scope.config = HsConfig;
    $scope.advancedSearch = false;
    $scope.endpointsService = HsCommonEndpointsService;

    $scope.$on('ows.wms_connecting', () => {
      $scope.data.wms_connecting = true;
    });

    /**
     * @function getPreviousRecords
     * @memberOf hs.datasource_selector
     * @param {object} endpoint Selected datasource
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
      HsDatasourceBrowserService.queryCatalog(endpoint);
    };

    /**
     * @function getNextRecords
     * @memberOf hs.datasource_selector
     * @param {object} endpoint Selected datasource
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
        HsDatasourceBrowserService.queryCatalog(endpoint);
      }
    };

    /**
     * @function showMetadata
     * @memberOf hs.datasource_selector
     * @param {object} endpoint Datasource of selected layer
     * @param {object} layer Metadata record of selected layer
     * @param {object} e
     * Show metadata record dialog window for selected layer.
     */
    $scope.showMetadata = function (endpoint, layer) {
      $scope.selected_layer = layer;
      $scope.selected_ds = endpoint;
      let filler = Promise.resolve();

      if (endpoint.type == 'layman') {
        filler = HsLaymanBrowserService.fillLayerMetadata(endpoint, layer);
      }
      filler.then(() => {
        $scope.metadata = decomposeMetadata(layer);
        if (HsConfig.design === 'md') {
          metadataDialog();
        } else {
          const previousDialog = HsLayoutService.contentWrapper.querySelector(
            '.hs-datasource_selector-metadata-dialog'
          );
          if (previousDialog) {
            previousDialog.parentNode.removeChild(previousDialog);
          }
          const el = angular.element(
            '<div hs.datasource_selector.metadata_dialog_directive></span>'
          );
          HsLayoutService.contentWrapper
            .querySelector('.hs-dialog-area')
            .appendChild(el[0]);
          $compile(el)($scope);
        }
      });
    };

    /**
     * @param input
     * @param prestring
     */
    function decomposeMetadata(input, prestring?) {
      if (HsUtilsService.isPOJO(input)) {
        return decomposeObject(input, prestring);
      } else if (Array.isArray(input)) {
        return decomposeArray(input, prestring);
      }
    }

    /**
     * @param obj
     * @param substring
     */
    function decomposeObject(obj, substring?) {
      let decomposed = {};
      let subvalue = undefined;
      Object.entries(obj).forEach((entry) => {
        const [key, value] = entry;
        if (key == 'feature') {
          return;
        }
        let newstring = '';
        if (substring !== undefined) {
          newstring = substring + ' - ' + key;
        } else {
          newstring = key;
        }
        if (HsUtilsService.isPOJO(value)) {
          subvalue = decomposeObject(value, newstring);
        } else if (Array.isArray(value)) {
          subvalue = decomposeArray(value, newstring);
        } else {
          subvalue = value;
        }
        if (HsUtilsService.isPOJO(subvalue)) {
          decomposed = HsUtilsService.structuredClone(subvalue, decomposed);
        } else {
          decomposed[newstring] = subvalue;
        }
      });
      return decomposed;
    }

    /**
     * @param arr
     * @param substring
     */
    function decomposeArray(arr: Array<any>, substring) {
      let decomposed = undefined;
      let sub = undefined;
      arr.forEach((value) => {
        if (HsUtilsService.isPOJO(value)) {
          sub = decomposeObject(value, substring);
        } else if (Array.isArray(value)) {
          sub = decomposeArray(value, substring);
        } else {
          sub += value;
        }
        if (HsUtilsService.isPOJO(sub)) {
          decomposed = HsUtilsService.structuredClone(sub, decomposed);
        } else {
          decomposed[substring] = sub;
        }
      });
      return decomposed;
    }

    /**
     *
     */
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
     * @param {object} ds Datasource of selected layer
     * @param {object} layer Metadata record of selected layer
     * Add selected layer to map (into layer manager) if possible (supported formats: WMS, WFS, Sparql, kml, geojson, json)
     * @param type
     */
    $scope.addLayerToMap = function (ds, layer, type) {
      HsDatasourceBrowserService.addLayerToMap(ds, layer, type);
      $scope.metadataModalVisible = false;
    };

    $scope.datasetSelect = HsDatasourceBrowserService.datasetSelect;

    $scope.$emit('scope_loaded', 'DatasourceSelector');
  },
};
