import {Injectable, NgZone} from '@angular/core';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {Observable, forkJoin} from 'rxjs';

import {DatasetType, HsAddDataService} from '../add-data.service';
import {EndpointsWithDatasourcesPipe} from '../../../common/widgets/endpoints-with-datasources.pipe';
import {HsAddDataCatalogueMapService} from './catalogue-map.service';
import {HsAddDataLayerDescriptor} from './layer-descriptor.model';
import {HsAddDataOwsService} from '../url/add-data-ows.service';
import {HsAddDataVectorService} from '../vector/vector.service';
import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../../common/layman/layman.service';
import {HsConfig} from '../../../config.service';
import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLaymanBrowserService} from './layman/layman.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsMapService} from '../../map/map.service';
import {HsMickaBrowserService} from './micka/micka.service';
import {HsUtilsService} from '../../utils/utils.service';

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
  editable?: boolean;
  workspace?: string;
  style?: string;
  recordType?: string;
};

export class HsAddDataCatalogueParams {
  data: any = {
    query: {
      textFilter: '',
      title: '',
      type: 'all',
      Subject: '',
      sortby: 'date',
    },
    textField: 'AnyText',
    selectedLayer: null,
    id_selected: 'OWS',
    filterByExtent: true,
    onlyMine: false,
  };
  selectedEndpoint: HsEndpoint;
  selectedLayer: HsAddDataLayerDescriptor;
  catalogEntries: HsAddDataLayerDescriptor[] = [];
  dataLoading: boolean;
  recordsPerPage = 20;
  listStart = 0;
  listNext = this.recordsPerPage;
  catalogQuery;
  endpointsWithDatasources: HsEndpoint[];
  matchedRecords: number;
  extentChangeSuppressed = false;

  constructor() {}
}

@Injectable({
  providedIn: 'root',
})
export class HsAddDataCatalogueService extends HsAddDataCatalogueParams {
  constructor(
    public hsConfig: HsConfig,
    public hsAddDataVectorService: HsAddDataVectorService,
    public hsEventBusService: HsEventBusService,
    public hsMickaBrowserService: HsMickaBrowserService,
    public hsLaymanBrowserService: HsLaymanBrowserService,
    public hsLayoutService: HsLayoutService,
    public hsCommonEndpointsService: HsCommonEndpointsService,
    public hsUtilsService: HsUtilsService,
    public hsMapService: HsMapService,
    public hsAddDataCatalogueMapService: HsAddDataCatalogueMapService,
    public hsAddDataService: HsAddDataService,
    public endpointsWithDatasourcesPipe: EndpointsWithDatasourcesPipe,
    private zone: NgZone,
    public hsCommonLaymanService: HsCommonLaymanService,
    public hsAddDataOwsService: HsAddDataOwsService
  ) {
    super();
    this.hsEventBusService.mainPanelChanges.subscribe((which) => {
      if (this.panelVisible()) {
        this.extentChangeSuppressed = true;
        if (
          this.dataSourceExistsAndEmpty() &&
          this.hsAddDataService.datasetSelected.getValue() == 'catalogue'
        ) {
          this.reloadData();
        }
      }

      this.calcExtentLayerVisibility();
    });

    this.hsCommonLaymanService.authChange.subscribe(() => {
      if (this.panelVisible()) {
        this.reloadData();
      }
    });

    this.hsAddDataService.datasetTypeSelected.subscribe((type) => {
      if (type == 'catalogue' && this.panelVisible()) {
        this.reloadData();
      }
    });

    this.endpointsWithDatasources = this.endpointsWithDatasourcesPipe.transform(
      this.hsCommonEndpointsService.endpoints
    );

    if (this.dataSourceExistsAndEmpty() && this.panelVisible()) {
      this.queryCatalogs();
      // this.hsMickaFilterService.fillCodesets();
    }
    this.hsEventBusService.mapExtentChanges.subscribe(
      this.hsUtilsService.debounce(
        ({map, event, extent}) => {
          if (!this.panelVisible() || this.extentChangeSuppressed) {
            this.extentChangeSuppressed = false;
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
  }

  resetList(): void {
    this.listStart = 0;
    this.listNext = this.recordsPerPage;
    this.selectedLayer = <HsAddDataLayerDescriptor>{};
    this.endpointsWithDatasources.forEach((ep: HsEndpoint) => {
      ep.datasourcePaging.start = 0;
      ep.datasourcePaging.next = ep.datasourcePaging.limit;
      ep.datasourcePaging.matched = 0;
    });
  }

  reloadData(): void {
    this.endpointsWithDatasources = this.endpointsWithDatasourcesPipe.transform(
      this.hsCommonEndpointsService.endpoints
    );
    this.resetList();

    this.queryCatalogs();
    // this.hsMickaFilterService.fillCodesets();
    this.calcExtentLayerVisibility();
  }

  /**
   * Queries all configured catalogs for datasources (layers)
   * @param suspendLimitCalculation
   */
  queryCatalogs(suspendLimitCalculation?: boolean): void {
    if (this.endpointsWithDatasources.length > 0) {
      if (this.catalogQuery) {
        this.catalogQuery.unsubscribe();
        delete this.catalogQuery;
      }
      this.clearLoadedData();

      this.hsMapService.loaded().then(() => {
        this.dataLoading = true;
        this.hsAddDataCatalogueMapService.clearExtentLayer();
        const observables: Observable<any>[] = [];
        //TODO Mark non functional endpoint
        for (const endpoint of this.endpointsWithDatasources) {
          if (!this.data.onlyMine || endpoint.type.includes('layman')) {
            const promise = this.queryCatalog(endpoint);
            observables.push(promise);
          }
        }
        this.catalogQuery = forkJoin(observables).subscribe(() => {
          suspendLimitCalculation
            ? this.createLayerList()
            : this.calculateEndpointLimits();
        });
      });
    }
  }
  /**
   * Calculates each endpoint layer request limit, based on the matched layers ratio
   * from all endpoint matched layers
   */
  calculateEndpointLimits(): void {
    this.matchedRecords = 0;
    this.endpointsWithDatasources = this.endpointsWithDatasources.filter(
      (ep) => ep.datasourcePaging.matched != 0
    );
    if (this.endpointsWithDatasources.length == 0) {
      this.dataLoading = false;
      return;
    }
    this.endpointsWithDatasources.forEach(
      (ep) => (this.matchedRecords += ep.datasourcePaging.matched)
    );
    let sumLimits = 0;
    this.endpointsWithDatasources.forEach((ep) => {
      ep.datasourcePaging.limit = Math.floor(
        (ep.datasourcePaging.matched / this.matchedRecords) *
          this.recordsPerPage
      );
      if (ep.datasourcePaging.limit == 0) {
        ep.datasourcePaging.limit = 1;
      }
      sumLimits += ep.datasourcePaging.limit;
    });
    this.recordsPerPage = sumLimits;
    this.listNext = this.recordsPerPage;
    this.queryCatalogs(true);
  }

  createLayerList(): void {
    for (const endpoint of this.endpointsWithDatasources) {
      if (!this.data.onlyMine || endpoint.type.includes('layman')) {
        if (endpoint.layers) {
          endpoint.layers.forEach((layer) => {
            layer.endpoint = endpoint;
            // this.catalogEntries.push(layer);
          });

          if (this.catalogEntries.length > 0) {
            this.filterDuplicates(endpoint);
          } else {
            this.catalogEntries = this.catalogEntries.concat(endpoint.layers);
          }
        }
      }
    }

    if (this.matchedRecords < this.recordsPerPage) {
      this.listNext = this.matchedRecords;
    }

    this.catalogEntries.sort((a, b) => a.title.localeCompare(b.title));
    this.dataLoading = false;
  }

  filterDuplicates(endpoint: HsEndpoint): Array<any> {
    if (endpoint.layers === undefined || endpoint.layers?.length == 0) {
      return [];
    }

    const filteredLayers = endpoint.layers.filter(
      (layer) =>
        this.catalogEntries.filter(
          (u) =>
            u.id == layer.id ||
            u.id == 'm-' + layer.id ||
            'm-' + u.id == layer.id
        ).length == 0
    );

    if (endpoint.type.includes('layman')) {
      this.matchedRecords -= endpoint.layers.length - filteredLayers.length;
    }
    this.catalogEntries = this.catalogEntries.concat(filteredLayers);
  }

  getNextRecords(): void {
    this.listStart += this.recordsPerPage;
    this.listNext += this.recordsPerPage;
    if (this.listNext > this.matchedRecords) {
      this.listNext = this.matchedRecords;
    }
    this.endpointsWithDatasources.forEach(
      (ep) => (ep.datasourcePaging.start += ep.datasourcePaging.limit)
    );
    this.queryCatalogs(true);
  }

  getPreviousRecords(): void {
    if (this.listStart - this.recordsPerPage <= 0) {
      this.listStart = 0;
      this.listNext = this.recordsPerPage;
      this.endpointsWithDatasources.forEach(
        (ep: HsEndpoint) => (ep.datasourcePaging.start = 0)
      );
    } else {
      this.listStart -= this.recordsPerPage;
      this.listNext = this.listStart + this.recordsPerPage;
      this.endpointsWithDatasources.forEach(
        (ep: HsEndpoint) =>
          (ep.datasourcePaging.start -= ep.datasourcePaging.limit)
      );
    }
    this.queryCatalogs(true);
  }

  changeRecordsPerPage(perPage: number): void {
    this.resetList();
    this.queryCatalogs();
  }

  clearLoadedData(): void {
    this.catalogEntries = [];
    this.endpointsWithDatasources.forEach((ep) => (ep.layers = []));
  }

  /**
   * Loads datasets metadata from selected source (CSW server).
   * Uses pagination set by 'start' attribute of 'dataset' param.
   * Currently supports only "Micka" type of source.
   * Use all query params (search text, bbox, params.., sorting, start)
   * @param catalog - Configuration of selected datasource (from app config)
   */
  queryCatalog(catalog: HsEndpoint): any {
    this.hsAddDataCatalogueMapService.clearDatasetFeatures(catalog);
    let query;
    switch (catalog.type) {
      case 'micka':
        query = this.hsMickaBrowserService.queryCatalog(
          catalog,
          this.data,
          (feature: Feature<Geometry>) =>
            this.hsAddDataCatalogueMapService.addExtentFeature(feature),
          this.data.textField
        );
        return query;
      case 'layman':
      case 'layman-wagtail':
        query = this.hsLaymanBrowserService.queryCatalog(
          catalog,
          this.data,
          (feature: Feature<Geometry>) =>
            this.hsAddDataCatalogueMapService.addExtentFeature(feature)
        );
        return query;
      default:
        break;
    }
  }

  /**
   * Test if layer of selected record is downloadable (KML and JSON files, with direct URL) and gives URL.
   * @param ds - Datasource of selected layer
   * @param layer - Metadata record of selected layer
   * @returns Download URL of layer if possible
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
   * Get URL for RDF-DCAT record of selected layer
   * @param ds - Datasource of selected layer
   * @param layer - Metadata record of selected layer
   * @returns URL to record file
   */
  layerRDF(ds: HsEndpoint, layer): string {
    return `${ds.url}?request=GetRecordById&id=${layer.id}&outputschema=http://www.w3.org/ns/dcat%23`;
  }

  /**
   * Add selected layer to map (into layer manager) if possible
   * @param ds - Datasource of selected layer
   * @param layer - Metadata record of selected layer
   * @param type - Type of layer (supported values: WMS, WFS, Sparql, kml, geojson, json)
   * @returns Type or array of types in which this layer can be added to map
   */
  async addLayerToMap(
    ds: HsEndpoint,
    layer: HsAddDataLayerDescriptor,
    type?: string
  ): Promise<string[] | string | void> {
    let whatToAdd: WhatToAddDescriptor;

    if (ds.type == 'micka') {
      whatToAdd = await this.hsMickaBrowserService.describeWhatToAdd(ds, layer);
    } else if (ds.type.includes('layman')) {
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
      whatToAdd.link = Array.isArray(whatToAdd.link)
        ? whatToAdd.link.filter((link) => link.toLowerCase().includes('wms'))[0]
        : whatToAdd.link;
      if (ds.type == 'micka' && whatToAdd.recordType != 'dataset') {
        this.datasetSelect('url');
      }
      await this.hsAddDataOwsService.connectToOWS({
        type: whatToAdd.type.toLowerCase(),
        uri: decodeURIComponent(whatToAdd.link),
        layer:
          ds.type.includes('layman') || whatToAdd.recordType === 'dataset'
            ? ds.type.includes('layman')
              ? layer.name
              : whatToAdd.name
            : undefined,
      });
    } else if (whatToAdd.type == 'WFS') {
      if (ds.type == 'micka') {
        if (!whatToAdd.workspace) {
          this.datasetSelect('url');
        }
        whatToAdd.link = Array.isArray(whatToAdd.link)
          ? whatToAdd.link.filter((link) =>
              link.toLowerCase().includes('wfs')
            )[0]
          : whatToAdd.link;
        await this.hsAddDataOwsService.connectToOWS({
          type: whatToAdd.type.toLowerCase(),
          uri: decodeURIComponent(whatToAdd.link),
          layer: whatToAdd.workspace
            ? `${whatToAdd.workspace}:${whatToAdd.name}`
            : undefined,
          style: whatToAdd.style,
        });
      } else {
        //Layman layers of logged user/ with write access
        if (whatToAdd.editable) {
          const layer = await this.hsAddDataVectorService.addVectorLayer(
            'wfs',
            whatToAdd.link.replace('_wms/ows', '/wfs'),
            whatToAdd.name,
            whatToAdd.title,
            whatToAdd.abstract,
            whatToAdd.projection,
            {
              extractStyles: whatToAdd.extractStyles,
              workspace: whatToAdd.workspace,
              style: whatToAdd.style,
              saveToLayman: true,
            }
          );
          this.hsAddDataVectorService.fitExtent(layer);
          this.datasetSelect('catalogue');
        } else {
          //Layman layers without write access
          await this.hsAddDataOwsService.connectToOWS({
            type: 'wfs',
            uri: whatToAdd.link.replace('_wms/ows', '/wfs'),
            style: whatToAdd.style,
            layer: `${whatToAdd.workspace}:${whatToAdd.name}`,
          });
        }
        this.hsLayoutService.setMainPanel('layermanager');
      }
    } else if (['KML', 'GEOJSON'].includes(whatToAdd.type)) {
      const layer = await this.hsAddDataVectorService.addVectorLayer(
        whatToAdd.type.toLowerCase(),
        whatToAdd.link,
        whatToAdd.name,
        whatToAdd.title,
        whatToAdd.abstract,
        whatToAdd.projection,
        {extractStyles: whatToAdd.extractStyles}
      );
      this.hsAddDataVectorService.fitExtent(layer);
    } else if (whatToAdd.type == 'WMTS' && ds.type == 'micka') {
      //Micka only yet
      if (whatToAdd.recordType === 'service') {
        this.datasetSelect('url');
      }
      await this.hsAddDataOwsService.connectToOWS({
        type: whatToAdd.type.toLowerCase(),
        uri: decodeURIComponent(whatToAdd.link),
        layer: whatToAdd.recordType === 'dataset' ? whatToAdd.name : undefined,
      });
    } else {
      this.hsLayoutService.setMainPanel('layermanager');
    }
    return whatToAdd.type;
  }

  datasetSelect(id_selected: DatasetType): void {
    this.data.id_selected = id_selected;
    this.hsAddDataService.selectType(id_selected);
    this.calcExtentLayerVisibility();
  }

  /**
   * Clear the "query" property
   */
  clear(): void {
    this.data.query.textFilter = '';
    this.data.query.title = '';
    this.data.query.Subject = '';
    this.data.query.keywords = '';
    this.data.query.OrganisationName = '';
    this.data.query.sortby = '';
  }

  calcExtentLayerVisibility(): void {
    this.hsAddDataCatalogueMapService.extentLayer.setVisible(
      this.panelVisible() &&
        this.hsAddDataService.datasetSelected.getValue() == 'catalogue'
    );
  }

  private dataSourceExistsAndEmpty(): boolean {
    return !!this.endpointsWithDatasources;
  }

  private panelVisible(): boolean {
    return this.hsLayoutService.panelVisible('addData');
  }
}
