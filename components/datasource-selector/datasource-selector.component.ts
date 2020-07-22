import './layman/layman.service';
import * as angular from 'angular';
import {Component} from '@angular/core';
import {HsConfig} from '../../config.service';
import {HsDatasourcesMapService} from './datasource-selector-map.service';
import {HsDatasourcesService} from './datasource-selector.service';
import {HsLaymanBrowserService} from './layman/layman.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../core/log.service';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs.datasource-selector',
  template: require('./partials/datasource_selector.html'),
})
export class HsDatasourcesComponent {
  $scope;
  $injector;
  metadataModalVisible;
  data;
  HsCore;
  DS;
  mapService;
  config;
  advancedSearch;
  endpointsService;
  datasetSelect;
  selected_layer;
  selected_ds;
  metadata;

  constructor(
    $scope,
    $compile,
    $injector,
    HsCommonEndpointsService,
    private HsConfig: HsConfig,
    HsCore,
    private HsDatasourcesService: HsDatasourcesService,
    private HsDatasourcesMapService: HsDatasourcesMapService,
    private HsLaymanBrowserService,
    private HsLayoutService: HsLayoutService,
    private HsLogService: HsLogService,
    private HsUtilsService: HsUtilsService
  ) {
    'ngInject';
    this.$scope = $scope;
    this.$injector = $injector;
    this.HsCore = HsCore;
    this.data = HsDatasourcesService.data;
    this.DS = HsDatasourcesService;
    this.mapService = HsDatasourcesMapService;
    this.config = HsConfig;
    this.advancedSearch = false;
    this.endpointsService = HsCommonEndpointsService;
    this.datasetSelect = HsDatasourcesService.datasetSelect;

    $scope.$on('ows.wms_connecting', () => {
      $scope.data.wms_connecting = true;
    });

    $scope.$emit('scope_loaded', 'DatasourceSelector');
  }

  /**
   * @function getPreviousRecords
   * @memberof hs.datasource_selector
   * @param {object} endpoint Selected datasource
   * Loads previous records of datasets from selected datasource (based on number of results per page and current start)
   */
  getPreviousRecords(endpoint): void {
    const paging = endpoint.datasourcePaging;
    const itemsPerPage = endpoint.paging.itemsPerPage;
    if (paging.start - itemsPerPage < 0) {
      paging.start = 0;
      paging.next = itemsPerPage;
    } else {
      paging.start -= itemsPerPage;
      paging.next = paging.start + itemsPerPage;
    }
    this.HsDatasourcesService.queryCatalog(endpoint);
  }

  /**
   * @function getNextRecords
   * @memberof hs.datasource_selector
   * @param {object} endpoint Selected datasource
   * Loads next records of datasets from selected datasource (based on number of results per page and current start)
   */
  getNextRecords(endpoint): void {
    const paging = endpoint.datasourcePaging;
    const itemsPerPage = endpoint.paging.itemsPerPage;
    if (paging.next != 0) {
      paging.start = Math.floor(paging.next / itemsPerPage) * itemsPerPage;
      if (paging.next + itemsPerPage > paging.matched) {
        paging.next = paging.matched;
      } else {
        paging.next += itemsPerPage;
      }
      this.HsDatasourcesService.queryCatalog(endpoint);
    }
  }

  /**
   * @function showMetadata
   * @memberof hs.datasource_selector
   * @param {object} endpoint Datasource of selected layer
   * @param {object} layer Metadata record of selected layer
   * Show metadata record dialog window for selected layer.
   */
  showMetadata(endpoint, layer): void {
    this.selected_layer = layer;
    this.selected_ds = endpoint;
    let filler = Promise.resolve();

    if (endpoint.type == 'layman') {
      filler = this.HsLaymanBrowserService.fillLayerMetadata(endpoint, layer);
    }
    filler.then(() => {
      //TODO: <hs.datasource_selector.metadata_dialog_directive>
      /*this.metadata = this.decomposeMetadata(layer);
      if (this.HsConfig.design === 'md') {
        this.metadataDialog();
      } else {
        const previousDialog = this.HsLayoutService.contentWrapper.querySelector(
          '.hs-datasource_selector-metadata-dialog'
        );
        if (previousDialog) {
          previousDialog.parentNode.removeChild(previousDialog);
        }
        const el = angular.element(
          '<div hs.datasource_selector.metadata_dialog_directive></span>'
        );
        this.HsLayoutService.contentWrapper
          .querySelector('.hs-dialog-area')
          .appendChild(el[0]);
        $compile(el)($scope);
      }*/
    });
  }

  /**
   * @param input
   * @param prestring
   */
  decomposeMetadata(input, prestring?: string) {
    if (this.HsUtilsService.isPOJO(input)) {
      return this.decomposeObject(input, prestring);
    } else if (Array.isArray(input)) {
      return this.decomposeArray(input, prestring);
    }
  }

  /**
   * @param obj
   * @param substring
   */
  decomposeObject(obj, substring?: string) {
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
      if (this.HsUtilsService.isPOJO(value)) {
        subvalue = this.decomposeObject(value, newstring);
      } else if (Array.isArray(value)) {
        subvalue = this.decomposeArray(value, newstring);
      } else {
        subvalue = value;
      }
      if (this.HsUtilsService.isPOJO(subvalue)) {
        decomposed = this.HsUtilsService.structuredClone(subvalue, decomposed);
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
  decomposeArray(arr: Array<any>, substring: string) {
    let decomposed = undefined;
    let sub = undefined;
    arr.forEach((value) => {
      if (this.HsUtilsService.isPOJO(value)) {
        sub = this.decomposeObject(value, substring);
      } else if (Array.isArray(value)) {
        sub = this.decomposeArray(value, substring);
      } else {
        sub += value;
      }
      if (this.HsUtilsService.isPOJO(sub)) {
        decomposed = this.HsUtilsService.structuredClone(sub, decomposed);
      } else {
        decomposed[substring] = sub;
      }
    });
    return decomposed;
  }

  /**
   *
   */
  metadataDialog(): void {
    try {
      const $mdDialog = this.$injector.get('$mdDialog');

      $mdDialog.show({
        parent: angular.element('#hsContainer'),
        clickOutsideToClose: true,
        escapeToClose: true,
        scope: this.$scope,
        preserveScope: true,
        template: require('./partials/datasourceBrowserMetadata.html'),
        controller: function DialogController($scope, $mdDialog) {
          $scope.closeDialog = function () {
            $mdDialog.hide();
          };
        },
      });
    } catch (ex) {
      this.HsLogService.error('Failed to create metadataDialog.');
      // continue regardless of error
    }
  }

  /**
   * @function addLayerToMap
   * @memberof hs.datasource_selector
   * @param {object} ds Datasource of selected layer
   * @param {object} layer Metadata record of selected layer
   * Add selected layer to map (into layer manager) if possible (supported formats: WMS, WFS, Sparql, kml, geojson, json)
   * @param type
   */
  addLayerToMap(ds, layer, type): void {
    this.HsDatasourcesService.addLayerToMap(ds, layer, type);
    this.metadataModalVisible = false;
  }
}
