import * as HsCommonEndpointsService from '../../common/endpoints/endpoints.service';
import * as angular from 'angular';
import {HsAddLayersVectorService} from '../add-layers/vector/add-layers-vector.service';
import {HsConfig} from '../../config.service';
import {HsDatasourcesMapService} from './datasource-selector-map.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsForDatasourceBrowserFilter} from './for-datasource-browser.filter';
import {HsLaymanBrowserService} from './layman/layman.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMickaBrowserService} from './micka/micka.service';
import {HsMickaFilterService} from './micka/micka-filters.service';
import {HsUtilsService} from '../utils/utils.service';

export class HsDatasourcesService {
  data: any = {};

  /**
   * @param $rootScope
   * @param HsConfig
   * @param HsAddLayersVectorService
   * @param HsEventBusService
   * @param HsMickaFiltersService
   * @param HsMickaBrowserService
   * @param HsLaymanBrowserService
   * @param HsLayoutService
   * @param HsCommonEndpointsService
   * @param HsUtilsService
   * @param HsDataSourceSelectorMapService
   * @param forDatasourceBrowserFilter
   * @param $compile
   */
  constructor(
    private $rootScope,
    private HsConfig: HsConfig,
    private HsAddLayersVectorService: HsAddLayersVectorService,
    private HsEventBusService: HsEventBusService,
    private HsMickaFilterService,
    private HsMickaBrowserService,
    private HsLaymanBrowserService,
    private HsLayoutService: HsLayoutService,
    private HsCommonEndpointsService: HsCommonEndpointsService,
    private HsUtilsService: HsUtilsService,
    private HsDatasourcesMapService: HsDatasourcesMapService,
    private HsForDatasourceBrowserFilter,
    private $compile
  ) {
    'ngInject';

    this.data.query = {
      textFilter: '',
      title: '',
      type: 'service',
      Subject: '',
    };

    this.data.textField = 'AnyText';
    this.data.selectedLayer = null;
    this.data.wms_connecting = false;
    this.data.id_selected = 'OWS';

    if (this.dataSourceExistsAndEmpty() && this.panelVisible()) {
      this.queryCatalogs();
      this.HsMickaFilterService.fillCodesets();
    }

    if (this.HsConfig.allowAddExternalDatasets === undefined) {
      this.HsConfig.allowAddExternalDatasets = true;
    }

    this.HsEventBusService.mapExtentChanges.subscribe(
      HsUtilsService.debounce(
        (e) => {
          if (!this.panelVisible()) {
            return;
          }
          if (this.HsMickaFilterService.filterByExtent) {
            this.queryCatalogs();
          }
        },
        500,
        false,
        this
      )
    );

    this.HsEventBusService.mainPanelChanges.subscribe(() => {
      if (this.dataSourceExistsAndEmpty() && this.panelVisible()) {
        this.queryCatalogs();
        this.HsMickaFilterService.fillCodesets();
      }
      this.calcExtentLayerVisibility();
    });
  }

  /**
   * @function queryCatalogs
   * @memberof HsDatasourceBrowserService
   * @description Queries all configured catalogs for datasources (layers)
   */
  queryCatalogs(): void {
    this.HsDatasourcesMapService.clearExtentLayer();
    this.HsCommonEndpointsService.endpoints.forEach((endpoint) => {
      if (endpoint.datasourcePaging) {
        endpoint.datasourcePaging.start = 0;
      }
      this.queryCatalog(endpoint);
    });
  }

  /**
   * @function queryCatalog
   * @memberof HsDatasourceBrowserService
   * @param {object} catalog Configuration of selected datasource (from app config)
   * @description Loads datasets metadata from selected source (CSW server).
   * Uses pagination set by 'start' attribute of 'dataset' param.
   * Currently supports only "Micka" type of source.
   * Use all query params (search text, bbox, params.., sorting, start)
   */
  queryCatalog(catalog): void {
    this.HsDatasourcesMapService.clearDatasetFeatures(catalog);
    switch (catalog.type) {
      case 'micka':
        this.HsMickaBrowserService.queryCatalog(
          catalog,
          this.data.query,
          this.HsDatasourcesMapService.addExtentFeature,
          this.data.textField
        );
        break;
      case 'layman':
        this.HsLaymanBrowserService.queryCatalog(catalog);
        break;
      default:
        break;
    }
  }

  /**
   * @function layerDownload
   * @memberof hs.datasource_selector
   * @param {object} ds Datasource of selected layer
   * @param {object} layer Metadata record of selected layer
   * @returns {string} Download url of layer if possible
   * Test if layer of selected record is downloadable (KML and JSON files, with direct url) and gives Url.
   */
  layerDownload(ds, layer): string {
    if (ds.download == true) {
      if (
        ['kml', 'geojson', 'json'].indexOf(layer.formats[0].toLowerCase()) >
          -1 &&
        layer.url.length > 0
      ) {
        return layer.url;
      }
    }
    return '#';
  }

  /**
   * @function layerRDF
   * @memberof hs.datasource_selector
   * @param {object} ds Datasource of selected layer
   * @param {object} layer Metadata record of selected layer
   * @returns {string} URL to record file
   * Get URL for RDF-DCAT record of selected layer
   */
  layerRDF(ds, layer): string {
    return `${ds.url}?request=GetRecordById&id=${layer.id}&outputschema=http://www.w3.org/ns/dcat%23`;
  }

  /**
   * @function addLayerToMap
   * @memberof hs.datasource_selector
   * @param {object} ds Datasource of selected layer
   * @param {object} layer Metadata record of selected layer
   * @param {string} type Type of layer (supported values: WMS, WFS, Sparql, kml, geojson, json)
   * Add selected layer to map (into layer manager) if possible
   */
  async addLayerToMap(ds, layer, type) {
    let describer = Promise.resolve({type: 'none'});
    if (ds.type == 'micka') {
      describer = this.HsMickaBrowserService.describeWhatToAdd(ds, layer);
    } else if (ds.type == 'layman') {
      describer = this.HsLaymanBrowserService.describeWhatToAdd(ds, layer);
    }
    describer.then(async (whatToAdd: any) => {
      if (type !== undefined) {
        whatToAdd.type = type;
      }
      if (Array.isArray(whatToAdd.type)) {
        const scope = this.$rootScope.$new();
        Object.assign(scope, {
          types: whatToAdd.type,
          layer,
          endpoint: ds,
        });
        const el = angular.element(
          '<hs-select-type-to-add-layer-dialog layer="layer" endpoint="endpoint" types="types"></hs-select-type-to-add-layer-dialog>'
        );
        this.HsLayoutService.contentWrapper
          .querySelector('.hs-dialog-area')
          .appendChild(el[0]);
        this.$compile(el)(scope);
        return;
      }
      if (whatToAdd.type == 'WMS') {
        this.datasetSelect('OWS');
        setTimeout(() => {
          this.$rootScope.$broadcast(
            'ows.filling',
            whatToAdd.type.toLowerCase(),
            decodeURIComponent(whatToAdd.link),
            whatToAdd.layer
          );
        });
      } else if (whatToAdd.type == 'WFS') {
        const layer = await this.HsAddLayersVectorService.addVectorLayer(
          'wfs',
          whatToAdd.link,
          whatToAdd.title,
          whatToAdd.abstract,
          whatToAdd.projection,
          {extractStyles: whatToAdd.extractStyles}
        );
        this.HsAddLayersVectorService.fitExtent(layer);
      } else if (['KML', 'GEOJSON'].indexOf(whatToAdd.type) > -1) {
        const layer = await this.HsAddLayersVectorService.addVectorLayer(
          whatToAdd.type.toLowerCase(),
          whatToAdd.link,
          whatToAdd.title,
          whatToAdd.abstract,
          whatToAdd.projection,
          {extractStyles: whatToAdd.extractStyles}
        );
        this.HsAddLayersVectorService.fitExtent(layer);
      } else {
        this.HsLayoutService.setMainPanel('layermanager');
      }
    });
  }

  datasetSelect(id_selected): void {
    this.data.wms_connecting = false;
    this.data.id_selected = id_selected;
    this.calcExtentLayerVisibility();
  }

  /**
   * @function clear
   * @memberof HsDatasourceBrowserService
   * Clear query variable
   */
  clear(): void {
    this.data.query.textFilter = '';
    this.data.query.title = '';
    this.data.query.Subject = '';
    this.data.query.keywords = '';
    this.data.query.OrganisationName = '';
    this.data.query.sortby = '';
  }

  /**
   *
   */
  dataSourceExistsAndEmpty(): boolean {
    return (
      this.HsForDatasourceBrowserFilter(
        this.HsCommonEndpointsService.endpoints
      ).filter((ep) => !ep.datasourcePaging.loaded).length > 0
    );
  }

  /**
   *
   */
  panelVisible(): boolean {
    return (
      this.HsLayoutService.panelVisible('datasource_selector') ||
      this.HsLayoutService.panelVisible('datasourceBrowser')
    );
  }

  calcExtentLayerVisibility(): void {
    this.HsDatasourcesMapService.extentLayer.setVisible(
      this.panelVisible() && this.data.id_selected != 'OWS'
    );
  }
}
