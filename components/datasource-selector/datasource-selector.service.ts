import {Feature} from 'ol';
import {Injectable} from '@angular/core';

//import {EndpointsWithDatasourcesPipe} from '../../common/widgets/endpoints-with-datasources.pipe';
import {HsAddLayersVectorService} from '../add-layers/vector/add-layers-vector.service';
import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsConfig} from '../../config.service';
import {HsDatasourceLayerDescriptor} from './datasource-layer-descriptor.interface';
import {HsDatasourcesMapService} from './datasource-selector-map.service';
import {HsEndpoint} from '../../common/endpoints/endpoint.interface';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLaymanBrowserService} from './layman/layman.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsMickaBrowserService} from './micka/micka.service';
import {HsMickaFilterService} from './micka/micka-filters.service';
import {HsUtilsService} from '../utils/utils.service';

//TODO: Find a better name and possibly turn it into a public interface
type WhatToAddDescriptor = {
  type: string;
  dsType?: string;
  layer?;
  link?;
  name?;
  title?: string;
  abstract?: string;
  projection?;
  extractStyles?;
};

@Injectable({
  providedIn: 'root',
})
export class HsDatasourcesService {
  data: any = {};
  selectedEndpoint: HsEndpoint;

  constructor(
    public hsConfig: HsConfig,
    public hsAddLayersVectorService: HsAddLayersVectorService,
    public hsEventBusService: HsEventBusService,
    public hsMickaFilterService: HsMickaFilterService,
    public hsMickaBrowserService: HsMickaBrowserService,
    public hsLaymanBrowserService: HsLaymanBrowserService,
    public hsLayoutService: HsLayoutService,
    public hsCommonEndpointsService: HsCommonEndpointsService,
    public hsUtilsService: HsUtilsService,
    public HsMapService: HsMapService,
    public hsDatasourcesMapService: HsDatasourcesMapService /*,
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
  reloadData(): void {
    this.queryCatalogs();
    this.hsMickaFilterService.fillCodesets();
    this.calcExtentLayerVisibility();
  }
  /**
   * @function queryCatalogs
   * @description Queries all configured catalogs for datasources (layers)
   */
  queryCatalogs(): void {
    this.HsMapService.loaded().then(() => {
      this.hsDatasourcesMapService.clearExtentLayer();
      for (const endpoint of this.hsCommonEndpointsService.endpoints) {
        if (endpoint.datasourcePaging) {
          endpoint.datasourcePaging.start = 0;
        }
        this.queryCatalog(endpoint);
      }
    });
  }

  /**
   * @function queryCatalog
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
          (feature: Feature) =>
            this.hsDatasourcesMapService.addExtentFeature(feature),
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
   * @param {HsEndpoint} ds Datasource of selected layer
   * @param {object} layer Metadata record of selected layer
   * @returns {string} Download url of layer if possible
   * @description Test if layer of selected record is downloadable (KML and JSON files, with direct url) and gives Url.
   */
  layerDownload(ds: HsEndpoint, layer): string {
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
   * @param {HsEndpoint} ds Datasource of selected layer
   * @param {object} layer Metadata record of selected layer
   * @returns {string} URL to record file
   * @description Get URL for RDF-DCAT record of selected layer
   */
  layerRDF(ds: HsEndpoint, layer): string {
    return `${ds.url}?request=GetRecordById&id=${layer.id}&outputschema=http://www.w3.org/ns/dcat%23`;
  }

  /**
   * @function addLayerToMap
   * @param {HsEndpoint} ds Datasource of selected layer
   * @param {object} layer Metadata record of selected layer
   * @param {string} type Type of layer (supported values: WMS, WFS, Sparql, kml, geojson, json)
   * @returns {any[] | any} Type or array of types in which this layer can be added to map
   * @description Add selected layer to map (into layer manager) if possible
   */
  async addLayerToMap(
    ds: HsEndpoint,
    layer: HsDatasourceLayerDescriptor,
    type?: string
  ): Promise<string[] | string | void> {
    let whatToAdd: WhatToAddDescriptor;
    if (ds.type == 'micka') {
      whatToAdd = await this.hsMickaBrowserService.describeWhatToAdd(ds, layer);
    } else if (ds.type == 'layman') {
      whatToAdd = await this.hsLaymanBrowserService.describeWhatToAdd(
        ds,
        layer
      );
    } else {
      whatToAdd = {type: 'none'};
    }
    if (!whatToAdd) {
      return;
    }
    if (type) {
      whatToAdd.type = type;
    }
    if (Array.isArray(whatToAdd.type)) {
      return whatToAdd.type;
    }
    if (whatToAdd.type == 'WMS') {
      this.datasetSelect('OWS');
      setTimeout(() => {
        this.hsEventBusService.owsFilling.next({
          type: whatToAdd.type.toLowerCase(),
          uri: decodeURIComponent(whatToAdd.link),
          layer: undefined,
        });
      });
    } else if (whatToAdd.type == 'WFS') {
      this.datasetSelect('OWS');
      if (ds.type == 'micka') {
        setTimeout(() => {
          this.hsEventBusService.owsFilling.next({
            type: whatToAdd.type.toLowerCase(),
            uri: decodeURIComponent(whatToAdd.link),
            layer: undefined, //layer.title || layer.name ||
          });
        });
      } else {
        const layer = await this.hsAddLayersVectorService.addVectorLayer(
          'wfs',
          whatToAdd.link,
          whatToAdd.name,
          whatToAdd.title,
          whatToAdd.abstract,
          whatToAdd.projection,
          {extractStyles: whatToAdd.extractStyles}
        );
        this.hsAddLayersVectorService.fitExtent(layer);
        this.hsLayoutService.setMainPanel('layermanager');
      }
    } else if (['KML', 'GEOJSON'].includes(whatToAdd.type)) {
      const layer = await this.hsAddLayersVectorService.addVectorLayer(
        whatToAdd.type.toLowerCase(),
        whatToAdd.link,
        whatToAdd.name,
        whatToAdd.title,
        whatToAdd.abstract,
        whatToAdd.projection,
        {extractStyles: whatToAdd.extractStyles}
      );
      this.hsAddLayersVectorService.fitExtent(layer);
    } else {
      this.hsLayoutService.setMainPanel('layermanager');
    }
    return whatToAdd.type;
  }

  datasetSelect(id_selected: string): void {
    this.data.wms_connecting = false;
    this.data.id_selected = id_selected;
    this.calcExtentLayerVisibility();
  }

  /**
   * @function clear
   * @description Clear query variable
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
