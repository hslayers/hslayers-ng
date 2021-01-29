import {Feature} from 'ol';
import {Injectable, NgZone} from '@angular/core';

import {EndpointsWithDatasourcesPipe} from '../../../common/widgets/endpoints-with-datasources.pipe';
import {HsAddDataCatalogueMapService} from './add-data-catalogue-map.service';
import {HsAddDataLayerDescriptor} from './add-data-layer-descriptor.interface';
import {HsAddDataService} from '../add-data.service';
import {HsAddDataVectorService} from '../vector/add-data-vector.service';
import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../../common/layman/layman.service';
import {HsConfig} from '../../../config.service';
import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLaymanBrowserService} from './layman/layman.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsMapService} from '../../map/map.service';
import {HsMickaBrowserService} from './micka/micka.service';
import {HsMickaFilterService} from '../../datasource-selector/micka/micka-filters.service';
import {HsUtilsService} from '../../utils/utils.service';
import {forkJoin} from 'rxjs';

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
export class HsAddDataCatalogueService {
  data: any = {};
  selectedEndpoint: HsEndpoint;
  catalogEntries = [];
  layersLoading: boolean;
  paging = {
    start: 0,
    limit: 20,
    loaded: false,
    matched: 0,
    next: 20, //default, change by config?
  };
  itemsPerPage = 20;
  listStart = 0;
  listNext = this.itemsPerPage;
  catalogQuery;
  endpointsWithDatasources: any[];

  constructor(
    public hsConfig: HsConfig,
    public HsAddDataVectorService: HsAddDataVectorService,
    public hsEventBusService: HsEventBusService,
    public hsMickaFilterService: HsMickaFilterService,
    public hsMickaBrowserService: HsMickaBrowserService,
    public hsLaymanBrowserService: HsLaymanBrowserService,
    public hsLayoutService: HsLayoutService,
    public hsCommonEndpointsService: HsCommonEndpointsService,
    public hsUtilsService: HsUtilsService,
    public HsMapService: HsMapService,
    public HsAddDataCatalogueMapService: HsAddDataCatalogueMapService,
    public HsAddDataService: HsAddDataService,
    public endpointsWithDatasourcesPipe: EndpointsWithDatasourcesPipe,
    private zone: NgZone,
    public HsCommonLaymanService: HsCommonLaymanService
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
    this.data.filterByExtent = true;
    this.data.onlyMine = false;

    if (this.dataSourceExistsAndEmpty() && this.panelVisible()) {
      this.queryCatalogs();
      this.hsMickaFilterService.fillCodesets();
    }

    if (this.hsConfig.allowAddExternalDatasets === undefined) {
      this.hsConfig.allowAddExternalDatasets = true;
    }

    this.endpointsWithDatasources = this.endpointsWithDatasourcesPipe.transform(
      this.hsCommonEndpointsService.endpoints
    );
    this.paging.limit = Math.ceil(20 / this.endpointsWithDatasources.length);

    this.hsEventBusService.mapExtentChanges.subscribe(
      this.hsUtilsService.debounce(
        (e) => {
          if (!this.panelVisible()) {
            return;
          }
          if (this.data.filterByExtent) {
            this.zone.run(() => {
              this.reloadData();
            });
          }
        },
        500,
        false,
        this
      )
    );

    this.hsEventBusService.mainPanelChanges.subscribe(() => {
      if (this.dataSourceExistsAndEmpty() && this.panelVisible()) {
        this.reloadData();
      }
      this.calcExtentLayerVisibility();
    });

    this.HsCommonLaymanService.authChange.subscribe(() => {
      this.reloadData();
    });
  }

  reloadData(): void {
    this.resetList();
    this.queryCatalogs();
    // this.hsMickaFilterService.fillCodesets();
    this.calcExtentLayerVisibility();
  }
  /**
   * @function queryCatalogs
   * @description Queries all configured catalogs for datasources (layers)
   */
  queryCatalogs(preserveLayers?: boolean): void {
    if (this.endpointsWithDatasources.length > 0) {
      if (this.catalogQuery) {
        this.catalogQuery.unsubscribe();
        delete this.catalogQuery;
      }
      if (preserveLayers === undefined || !preserveLayers) {
        this.catalogEntries.length = 0;
        this.paging.start = 0;
        this.paging.matched = 0;
      }

      this.HsMapService.loaded().then(() => {
        this.layersLoading = true;
        this.HsAddDataCatalogueMapService.clearExtentLayer();
        const observables = [];

        //TODO Mark non functional endpoint
        for (const endpoint of this.endpointsWithDatasources) {
          if (!this.data.onlyMine || endpoint.type == 'layman') {
            //TODO query only functional endpoints
            endpoint.datasourcePaging = {...this.paging};

            const promise = this.queryCatalog(endpoint);
            observables.push(promise);

          }
        }
        this.catalogQuery = forkJoin(observables).subscribe(() => {
          this.createLayerList();
        });
      });
    }
  }

  createLayerList(): void {
    let lastRequestMatched = 0;
    for (const endpoint of this.endpointsWithDatasources) {
      if (!this.data.onlyMine || endpoint.type == 'layman') {
        if (endpoint.layers) {
          endpoint.layers.forEach((layer) => {
            layer.endpoint = endpoint;
            // this.catalogEntries.push(layer);
          });
          if (this.catalogEntries.length > 0) {
            this.catalogEntries = this.catalogEntries.concat(
              this.filterDuplicates(endpoint.layers)
            );
          } else {
            this.catalogEntries = this.catalogEntries.concat(endpoint.layers);
          }
        }

        if (endpoint.datasourcePaging?.matched) {
          lastRequestMatched += endpoint.datasourcePaging.matched;
        }
      }
    }

    if (lastRequestMatched > this.paging.matched) {
      this.paging.matched = lastRequestMatched;
    }

    this.catalogEntries.sort((a, b) => a.title.localeCompare(b.title));
    this.layersLoading = false;

    this.checkIfPageIsFull();
  }

  filterDuplicates(responseArray: Array<any>): Array<any> {
    if (responseArray === undefined || responseArray?.length == 0) {
      return [];
    }
    const responseLayers = this.catalogEntries.filter(
      (layer) => layer.id !== undefined
    );
    return responseArray.filter(
      (data) => responseLayers.filter((u) => u.id == data.id).length == 0
    );
  }

  checkIfPageIsFull(): void {
    let boundByLimit: boolean;
    if (this.catalogEntries.length < this.paging.matched) {
      boundByLimit = true;
    }
    if (this.catalogEntries.length < this.listNext && boundByLimit) {
      this.paging.start += this.paging.limit;
      this.queryCatalogs(true);
    }
  }

  getNextRecords(): void {
    this.listStart += this.itemsPerPage;
    this.listNext += this.itemsPerPage;
    if (
      this.listNext > this.catalogEntries.length &&
      this.catalogEntries.length < this.paging.matched
    ) {
      this.paging.start += this.paging.limit;
      this.queryCatalogs(true);
    }
    if (this.listNext > this.paging.matched) {
      this.listNext = this.paging.matched;
    }
  }

  getPreviousRecords(): void {
    if (this.listStart - this.itemsPerPage < 0) {
      this.listStart = 0;
      this.listNext = this.itemsPerPage;
    } else {
      this.listStart -= this.itemsPerPage;
      this.listNext = this.listStart + this.itemsPerPage;
    }
  }

  resetList(): void {
    this.catalogEntries.length = 0;
    this.listStart = 0;
    this.listNext = this.itemsPerPage;
  }

  /**
   * @function queryCatalog
   * @param {HsEndpoint} catalog Configuration of selected datasource (from app config)
   * @description Loads datasets metadata from selected source (CSW server).
   * Uses pagination set by 'start' attribute of 'dataset' param.
   * Currently supports only "Micka" type of source.
   * Use all query params (search text, bbox, params.., sorting, start)
   */
  queryCatalog(catalog: HsEndpoint) {
    this.HsAddDataCatalogueMapService.clearDatasetFeatures(catalog);
    let query;
    switch (catalog.type) {
      case 'micka':
        query = this.hsMickaBrowserService.queryCatalog(
          catalog,
          this.data,
          (feature: Feature) =>
            this.HsAddDataCatalogueMapService.addExtentFeature(feature),
          this.data.textField
        );
        return query;
      case 'layman':
        query = this.hsLaymanBrowserService.queryCatalog(
          catalog,
          this.data.query.textFilter
        );
        return query;
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
    layer: HsAddDataLayerDescriptor,
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
      this.datasetSelect('url');
      setTimeout(() => {
        this.hsEventBusService.owsFilling.next({
          type: whatToAdd.type.toLowerCase(),
          uri: decodeURIComponent(whatToAdd.link),
          layer: undefined,
        });
      });
    } else if (whatToAdd.type == 'WFS') {
      this.datasetSelect('url');
      if (ds.type == 'micka') {
        setTimeout(() => {
          this.hsEventBusService.owsFilling.next({
            type: whatToAdd.type.toLowerCase(),
            uri: decodeURIComponent(whatToAdd.link),
            layer: undefined, //layer.title || layer.name ||
          });
        });
      } else {
        const layer = await this.HsAddDataVectorService.addVectorLayer(
          'wfs',
          whatToAdd.link,
          whatToAdd.name,
          whatToAdd.title,
          whatToAdd.abstract,
          whatToAdd.projection,
          {extractStyles: whatToAdd.extractStyles}
        );
        this.HsAddDataVectorService.fitExtent(layer);
        this.hsLayoutService.setMainPanel('layermanager');
      }
    } else if (['KML', 'GEOJSON'].includes(whatToAdd.type)) {
      const layer = await this.HsAddDataVectorService.addVectorLayer(
        whatToAdd.type.toLowerCase(),
        whatToAdd.link,
        whatToAdd.name,
        whatToAdd.title,
        whatToAdd.abstract,
        whatToAdd.projection,
        {extractStyles: whatToAdd.extractStyles}
      );
      this.HsAddDataVectorService.fitExtent(layer);
    } else {
      this.hsLayoutService.setMainPanel('layermanager');
    }
    return whatToAdd.type;
  }

  datasetSelect(id_selected: string): void {
    this.data.wms_connecting = false;
    this.data.id_selected = id_selected;
    this.HsAddDataService.selectType(id_selected);
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
    return !!this.endpointsWithDatasources;
  }

  /**
   *
   */
  panelVisible(): boolean {
    return this.hsLayoutService.panelVisible('addData');
  }

  calcExtentLayerVisibility(): void {
    this.HsAddDataCatalogueMapService.extentLayer.setVisible(
      this.panelVisible() && this.HsAddDataService.typeSelected == 'catalogue'
    );
  }
}
