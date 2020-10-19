import {Component} from '@angular/core';

import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsConfig} from '../../config.service';
import {HsCoreService} from '../core/core.service';
import {HsDatasourceLayerDescriptor} from './datasource-layer-descriptor.interface';
import {HsDatasourcesMapService} from './datasource-selector-map.service';
import {HsDatasourcesService} from './datasource-selector.service';
import {HsEndpoint} from '../../common/endpoints/endpoint.interface';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLaymanBrowserService} from './layman/layman.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs-datasource-selector',
  template: require('./partials/datasource-selector.html'),
})
export class HsDatasourcesComponent {
  data;
  advancedSearch;
  selected_layer;
  selected_ds;
  metadata;

  constructor(
    private hsCommonEndpointsService: HsCommonEndpointsService, //Used in template
    private hsConfig: HsConfig, //Used in template
    private hsCore: HsCoreService, //Used in template
    private hsDatasourcesService: HsDatasourcesService,
    private hsDatasourcesMapService: HsDatasourcesMapService, //Used in template
    private hsEventBusService: HsEventBusService,
    private hsLaymanBrowserService: HsLaymanBrowserService,
    private hsLayoutService: HsLayoutService,
    private hsLogService: HsLogService,
    private hsUtilsService: HsUtilsService
  ) {
    this.data = hsDatasourcesService.data;
    this.advancedSearch = false;

    this.hsEventBusService.wmsConnecting.subscribe(() => {
      this.data.wms_connecting = true;
    });
  }

  /**
   * @function getPreviousRecords
   * @param {HsEndpoint} endpoint Selected datasource
   * @description Loads previous records of datasets from selected datasource (based on number of results per page and current start)
   */
  getPreviousRecords(endpoint: HsEndpoint): void {
    const paging = endpoint.datasourcePaging;
    const itemsPerPage = endpoint.paging.itemsPerPage;
    if (paging.start - itemsPerPage < 0) {
      paging.start = 0;
      paging.next = itemsPerPage;
    } else {
      paging.start -= itemsPerPage;
      paging.next = paging.start + itemsPerPage;
    }
    this.hsDatasourcesService.queryCatalog(endpoint);
  }

  /**
   * @function getNextRecords
   * @param {HsEndpoint} endpoint Selected datasource
   * @description Loads next records of datasets from selected datasource (based on number of results per page and current start)
   */
  getNextRecords(endpoint: HsEndpoint): void {
    const paging = endpoint.datasourcePaging;
    const itemsPerPage = endpoint.paging.itemsPerPage;
    if (paging.next != 0) {
      paging.start = Math.floor(paging.next / itemsPerPage) * itemsPerPage;
      if (paging.next + itemsPerPage > paging.matched) {
        paging.next = paging.matched;
      } else {
        paging.next += itemsPerPage;
      }
      this.hsDatasourcesService.queryCatalog(endpoint);
    }
  }

  /**
   * @function showMetadata
   * @param {HsEndpoint} endpoint Datasource of selected layer
   * @param {object} layer Metadata record of selected layer
   * @description Show metadata record dialog window for selected layer.
   */
  showMetadata(endpoint: HsEndpoint, layer): void {
    this.selected_layer = layer;
    this.selected_ds = endpoint;
    let filler = Promise.resolve({});

    if (endpoint.type == 'layman') {
      filler = this.hsLaymanBrowserService.fillLayerMetadata(endpoint, layer);
    }
    filler.then(() => {
      //FIXME: Create new dialog <hs-datasources-metadata-dialog>
      /*this.metadata = this.decomposeMetadata(layer);
      if (this.hsConfig.design === 'md') {
        this.metadataDialog();
      } else {
        const previousDialog = this.hsLayoutService.contentWrapper.querySelector(
          '.hs-datasource_selector-metadata-dialog'
        );
        if (previousDialog) {
          previousDialog.parentNode.removeChild(previousDialog);
        }
        const el = angular.element(
          '<div hs-datasources-metadata-dialog></span>'
        );
        this.hsLayoutService.contentWrapper
          .querySelector('.hs-dialog-area')
          .appendChild(el[0]);
        $compile(el)($scope);
      }*/
    });
  }

  datasetSelect(id_selected: string): void {
    this.hsDatasourcesService.datasetSelect(id_selected);
  }

  /**
   * @param input
   * @param prestring
   */
  decomposeMetadata(input, prestring?: string) {
    if (this.hsUtilsService.isPOJO(input)) {
      return this.decomposeObject(input, prestring);
    } else if (Array.isArray(input)) {
      return this.decomposeArray(input, prestring);
    } else {
      return false;
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
      if (this.hsUtilsService.isPOJO(value)) {
        subvalue = this.decomposeObject(value, newstring);
      } else if (Array.isArray(value)) {
        subvalue = this.decomposeArray(value, newstring);
      } else {
        subvalue = value;
      }
      if (this.hsUtilsService.isPOJO(subvalue)) {
        decomposed = this.hsUtilsService.structuredClone(subvalue, decomposed);
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
      if (this.hsUtilsService.isPOJO(value)) {
        sub = this.decomposeObject(value, substring);
      } else if (Array.isArray(value)) {
        sub = this.decomposeArray(value, substring);
      } else {
        sub += value; //TODO: subtracting string to undefined creates 'undefinedvalue'
      }
      if (this.hsUtilsService.isPOJO(sub)) {
        decomposed = this.hsUtilsService.structuredClone(sub, decomposed);
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
      //FIXME:
      this.hsLogService.warn('not implemented');
      //const $mdDialog = this.$injector.get('$mdDialog');

      /*$mdDialog.show({
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
      });*/
    } catch (ex) {
      //this.HsLogService.error('Failed to create metadataDialog.');
      // continue regardless of error
    }
  }
}
