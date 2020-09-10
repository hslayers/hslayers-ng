import {Injectable} from '@angular/core';

//import {EndpointsWithDatasourcesPipe} from './endpoints-with-datasources.pipe';
import {HsAddLayersVectorService} from '../add-layers/vector/add-layers-vector.service';
import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsConfig} from '../../config.service';
import {HsDatasourcesMapService} from './datasource-selector-map.service';
import {HsEndpoint} from '../../common/endpoints/endpoint.interface';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLaymanBrowserService} from './layman/layman.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMickaBrowserService} from './micka/micka.service';
import {HsMickaFilterService} from './micka/micka-filters.service';
import {HsUtilsService} from '../utils/utils.service';

@Injectable({
  providedIn: 'root',
})
export class HsDatasourcesService {
  data: any = {};

  constructor(
    private hsConfig: HsConfig,
    private hsAddLayersVectorService: HsAddLayersVectorService,
    private hsEventBusService: HsEventBusService,
    private hsMickaFilterService: HsMickaFilterService,
    private hsMickaBrowserService: HsMickaBrowserService,
    private hsLaymanBrowserService: HsLaymanBrowserService,
    private hsLayoutService: HsLayoutService,
    private hsCommonEndpointsService: HsCommonEndpointsService,
    private hsUtilsService: HsUtilsService,
    private hsDatasourcesMapService: HsDatasourcesMapService /*,
    private endpointsWithDatasourcesPipe: EndpointsWithDatasourcesPipe*/
  ) {
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
      this.hsMickaFilterService.fillCodesets();
    }

    if (this.hsConfig.allowAddExternalDatasets === undefined) {
      this.hsConfig.allowAddExternalDatasets = true;
    }

    this.hsEventBusService.mapExtentChanges.subscribe(
      this.hsUtilsService.debounce(
        (e) => {
          if (!this.panelVisible()) {
            return;
          }
          if (this.hsMickaFilterService.filterByExtent) {
            this.queryCatalogs();
          }
        },
        500,
        false,
        this
      )
    );

    this.hsEventBusService.mainPanelChanges.subscribe(() => {
      if (this.dataSourceExistsAndEmpty() && this.panelVisible()) {
        this.queryCatalogs();
        this.hsMickaFilterService.fillCodesets();
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
    this.hsDatasourcesMapService.clearExtentLayer();
    this.hsCommonEndpointsService.endpoints.forEach((endpoint: HsEndpoint) => {
      if (endpoint.datasourcePaging) {
        endpoint.datasourcePaging.start = 0;
      }
      this.queryCatalog(endpoint);
    });
  }

  /**
   * @function queryCatalog
   * @memberof HsDatasourceBrowserService
   * @param {HsEndpoint} catalog Configuration of selected datasource (from app config)
   * @description Loads datasets metadata from selected source (CSW server).
   * Uses pagination set by 'start' attribute of 'dataset' param.
   * Currently supports only "Micka" type of source.
   * Use all query params (search text, bbox, params.., sorting, start)
   */
  queryCatalog(catalog: HsEndpoint): void {
    this.hsDatasourcesMapService.clearDatasetFeatures(catalog);
    switch (catalog.type) {
      case 'micka':
        this.hsMickaBrowserService.queryCatalog(
          catalog,
          this.data.query,
          this.hsDatasourcesMapService.addExtentFeature,
          this.data.textField
        );
        break;
      case 'layman':
        this.hsLaymanBrowserService.queryCatalog(catalog);
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
        ['kml', 'geojson', 'json'].includes(layer.formats[0].toLowerCase()) &&
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
  async addLayerToMap(ds, layer, type): Promise<void> {
    let describer = Promise.resolve({type: 'none'});
    if (ds.type == 'micka') {
      describer = this.hsMickaBrowserService.describeWhatToAdd(ds, layer);
    } else if (ds.type == 'layman') {
      describer = this.hsLaymanBrowserService.describeWhatToAdd(ds, layer);
    }
    describer.then(async (whatToAdd: any) => {
      if (type !== undefined) {
        whatToAdd.type = type;
      }
      if (Array.isArray(whatToAdd.type)) {
        //FIXME: $compile
        /*const scope = this.$rootScope.$new();
        Object.assign(scope, {
          types: whatToAdd.type,
          layer,
          endpoint: ds,
        });
        const el = angular.element(
          '<hs-select-type-to-add-layer-dialog layer="layer" endpoint="endpoint" types="types"></hs-select-type-to-add-layer-dialog>'
        );
        this.hsLayoutService.contentWrapper
          .querySelector('.hs-dialog-area')
          .appendChild(el[0]);
        this.$compile(el)(scope);*/
        return;
      }
      if (whatToAdd.type == 'WMS') {
        this.datasetSelect('OWS');
        setTimeout(() => {
          //FIXME: $rootScope.broadcast
          /*this.$rootScope.$broadcast(
            'ows.filling',
            whatToAdd.type.toLowerCase(),
            decodeURIComponent(whatToAdd.link),
            whatToAdd.layer
          );*/
        });
      } else if (whatToAdd.type == 'WFS') {
        const layer = await this.hsAddLayersVectorService.addVectorLayer(
          'wfs',
          whatToAdd.link,
          whatToAdd.title,
          whatToAdd.abstract,
          whatToAdd.projection,
          {extractStyles: whatToAdd.extractStyles}
        );
        this.hsAddLayersVectorService.fitExtent(layer);
      } else if (['KML', 'GEOJSON'].includes(whatToAdd.type)) {
        const layer = await this.hsAddLayersVectorService.addVectorLayer(
          whatToAdd.type.toLowerCase(),
          whatToAdd.link,
          whatToAdd.title,
          whatToAdd.abstract,
          whatToAdd.projection,
          {extractStyles: whatToAdd.extractStyles}
        );
        this.hsAddLayersVectorService.fitExtent(layer);
      } else {
        this.hsLayoutService.setMainPanel('layermanager');
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
      //TODO: This will be possible once we run on ng9 only
      /*this.endpointsWithDatasourcesPipe
        .transform(this.hsCommonEndpointsService.endpoints)*/
      this.hsCommonEndpointsService.endpoints
        .filter((ep) => ep.type != 'statusmanager')
        .filter((ep) => !ep.datasourcePaging.loaded).length > 0
    );
  }

  /**
   *
   */
  panelVisible(): boolean {
    return (
      this.hsLayoutService.panelVisible('datasource_selector') ||
      this.hsLayoutService.panelVisible('datasourceBrowser')
    );
  }

  calcExtentLayerVisibility(): void {
    this.hsDatasourcesMapService.extentLayer.setVisible(
      this.panelVisible() && this.data.id_selected != 'OWS'
    );
  }
}
