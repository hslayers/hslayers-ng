import {Injectable, NgZone} from '@angular/core';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {forkJoin} from 'rxjs';

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
export class HsAddDataCatalogueService {
  apps: {
    [id: string]: HsAddDataCatalogueParams;
  } = {default: new HsAddDataCatalogueParams()};

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
    this.hsEventBusService.mainPanelChanges.subscribe(({which, app}) => {
      if (this.panelVisible(app)) {
        this.get(app).extentChangeSuppressed = true;
        if (
          this.dataSourceExistsAndEmpty(app) &&
          this.hsAddDataService.get(app).dsSelected == 'catalogue'
        ) {
          this.reloadData(app);
        }
      }

      this.calcExtentLayerVisibility(app);
    });

    this.hsCommonLaymanService.authChange.subscribe(({app}) => {
      if (this.panelVisible(app)) {
        this.reloadData(app);
      }
    });

    this.hsAddDataService.datasetSelected.subscribe(({type, app}) => {
      if (type == 'catalogue' && this.panelVisible(app)) {
        this.reloadData(app);
      }
    });
  }

  get(app: string): HsAddDataCatalogueParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsAddDataCatalogueParams();
    }
    return this.apps[app ?? 'default'];
  }

  init(_app: string) {
    this.get(_app).endpointsWithDatasources =
      this.endpointsWithDatasourcesPipe.transform(
        this.hsCommonEndpointsService.endpoints
      );

    if (this.dataSourceExistsAndEmpty(_app) && this.panelVisible(_app)) {
      this.queryCatalogs(_app);
      // this.hsMickaFilterService.fillCodesets();
    }
    this.hsEventBusService.mapExtentChanges.subscribe(
      this.hsUtilsService.debounce(
        ({map, event, extent, app}) => {
          if (app == _app) {
            const appRef = this.get(app);
            if (!this.panelVisible(app) || appRef.extentChangeSuppressed) {
              appRef.extentChangeSuppressed = false;
              return;
            }
            if (appRef.data.filterByExtent) {
              this.zone.run(() => {
                this.reloadData(app);
              });
            }
          }
        },
        500,
        false,
        this
      )
    );
  }

  resetList(app: string): void {
    const appRef = this.get(app);
    appRef.listStart = 0;
    appRef.listNext = appRef.recordsPerPage;
    appRef.selectedLayer = <HsAddDataLayerDescriptor>{};
    appRef.endpointsWithDatasources.forEach((ep: HsEndpoint) => {
      ep.datasourcePaging.start = 0;
      ep.datasourcePaging.next = ep.datasourcePaging.limit;
      ep.datasourcePaging.matched = 0;
    });
  }

  reloadData(app: string): void {
    this.get(app).endpointsWithDatasources =
      this.endpointsWithDatasourcesPipe.transform(
        this.hsCommonEndpointsService.endpoints
      );
    this.resetList(app);

    this.queryCatalogs(app);
    // this.hsMickaFilterService.fillCodesets();
    this.calcExtentLayerVisibility(app);
  }

  /**
   * Queries all configured catalogs for datasources (layers)
   * @param suspendLimitCalculation
   */
  queryCatalogs(app: string, suspendLimitCalculation?: boolean): void {
    const appRef = this.get(app);
    if (appRef.endpointsWithDatasources.length > 0) {
      if (appRef.catalogQuery) {
        appRef.catalogQuery.unsubscribe();
        delete appRef.catalogQuery;
      }
      this.clearLoadedData(app);

      this.hsMapService.loaded(app).then(() => {
        appRef.dataLoading = true;
        this.hsAddDataCatalogueMapService.clearExtentLayer(app);
        const observables = [];

        //TODO Mark non functional endpoint
        for (const endpoint of appRef.endpointsWithDatasources) {
          if (!appRef.data.onlyMine || endpoint.type.includes('layman')) {
            const promise = this.queryCatalog(endpoint, app);
            observables.push(promise);
          }
        }
        appRef.catalogQuery = forkJoin(observables).subscribe(() => {
          suspendLimitCalculation
            ? this.createLayerList(app)
            : this.calculateEndpointLimits(app);
        });
      });
    }
  }
  /**
   * Calculates each endpoint layer request limit, based on the matched layers ratio
   * from all endpoint matched layers
   */
  calculateEndpointLimits(app: string): void {
    const appRef = this.get(app);
    appRef.matchedRecords = 0;
    appRef.endpointsWithDatasources = appRef.endpointsWithDatasources.filter(
      (ep) => ep.datasourcePaging.matched != 0
    );
    if (appRef.endpointsWithDatasources.length == 0) {
      appRef.dataLoading = false;
      return;
    }
    appRef.endpointsWithDatasources.forEach(
      (ep) => (appRef.matchedRecords += ep.datasourcePaging.matched)
    );
    let sumLimits = 0;
    appRef.endpointsWithDatasources.forEach((ep) => {
      ep.datasourcePaging.limit = Math.floor(
        (ep.datasourcePaging.matched / appRef.matchedRecords) *
          appRef.recordsPerPage
      );
      if (ep.datasourcePaging.limit == 0) {
        ep.datasourcePaging.limit = 1;
      }
      sumLimits += ep.datasourcePaging.limit;
    });
    appRef.recordsPerPage = sumLimits;
    appRef.listNext = appRef.recordsPerPage;
    this.queryCatalogs(app, true);
  }

  createLayerList(app: string): void {
    const appRef = this.get(app);
    for (const endpoint of appRef.endpointsWithDatasources) {
      if (!appRef.data.onlyMine || endpoint.type.includes('layman')) {
        if (endpoint.layers) {
          endpoint.layers.forEach((layer) => {
            layer.endpoint = endpoint;
            // this.catalogEntries.push(layer);
          });

          if (appRef.catalogEntries.length > 0) {
            this.filterDuplicates(endpoint, app);
          } else {
            appRef.catalogEntries = appRef.catalogEntries.concat(
              endpoint.layers
            );
          }
        }
      }
    }

    if (appRef.matchedRecords < appRef.recordsPerPage) {
      appRef.listNext = appRef.matchedRecords;
    }

    appRef.catalogEntries.sort((a, b) => a.title.localeCompare(b.title));
    appRef.dataLoading = false;
  }

  filterDuplicates(endpoint: HsEndpoint, app: string): Array<any> {
    const appRef = this.get(app);
    if (endpoint.layers === undefined || endpoint.layers?.length == 0) {
      return [];
    }

    const filteredLayers = endpoint.layers.filter(
      (layer) =>
        appRef.catalogEntries.filter(
          (u) =>
            u.id == layer.id ||
            u.id == 'm-' + layer.id ||
            'm-' + u.id == layer.id
        ).length == 0
    );

    if (endpoint.type.includes('layman')) {
      appRef.matchedRecords -= endpoint.layers.length - filteredLayers.length;
    }
    appRef.catalogEntries = appRef.catalogEntries.concat(filteredLayers);
  }

  getNextRecords(app: string): void {
    const appRef = this.get(app);
    appRef.listStart += appRef.recordsPerPage;
    appRef.listNext += appRef.recordsPerPage;
    if (appRef.listNext > appRef.matchedRecords) {
      appRef.listNext = appRef.matchedRecords;
    }
    appRef.endpointsWithDatasources.forEach(
      (ep) => (ep.datasourcePaging.start += ep.datasourcePaging.limit)
    );
    this.queryCatalogs(app, true);
  }

  getPreviousRecords(app: string): void {
    const appRef = this.get(app);
    if (appRef.listStart - appRef.recordsPerPage <= 0) {
      appRef.listStart = 0;
      appRef.listNext = appRef.recordsPerPage;
      appRef.endpointsWithDatasources.forEach(
        (ep: HsEndpoint) => (ep.datasourcePaging.start = 0)
      );
    } else {
      appRef.listStart -= appRef.recordsPerPage;
      appRef.listNext = appRef.listStart + appRef.recordsPerPage;
      appRef.endpointsWithDatasources.forEach(
        (ep: HsEndpoint) =>
          (ep.datasourcePaging.start -= ep.datasourcePaging.limit)
      );
    }
    this.queryCatalogs(app, true);
  }

  changeRecordsPerPage(perPage: number, app: string): void {
    this.resetList(app);
    this.queryCatalogs(app);
  }

  clearLoadedData(app: string): void {
    const appRef = this.get(app);
    appRef.catalogEntries = [];
    appRef.endpointsWithDatasources.forEach((ep) => (ep.layers = []));
  }

  /**
   * Loads datasets metadata from selected source (CSW server).
   * Uses pagination set by 'start' attribute of 'dataset' param.
   * Currently supports only "Micka" type of source.
   * Use all query params (search text, bbox, params.., sorting, start)
   * @param catalog - Configuration of selected datasource (from app config)
   */
  queryCatalog(catalog: HsEndpoint, app: string): any {
    const appRef = this.get(app);
    this.hsAddDataCatalogueMapService.clearDatasetFeatures(catalog, app);
    let query;
    switch (catalog.type) {
      case 'micka':
        query = this.hsMickaBrowserService.queryCatalog(
          catalog,
          appRef.data,
          (feature: Feature<Geometry>) =>
            this.hsAddDataCatalogueMapService.addExtentFeature(feature, app),
          appRef.data.textField,
          app
        );
        return query;
      case 'layman':
      case 'layman-wagtail':
        query = this.hsLaymanBrowserService.queryCatalog(
          catalog,
          app,
          appRef.data,
          (feature: Feature<Geometry>) =>
            this.hsAddDataCatalogueMapService.addExtentFeature(feature, app)
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
    app: string,
    type?: string
  ): Promise<string[] | string | void> {
    let whatToAdd: WhatToAddDescriptor;

    if (ds.type == 'micka') {
      whatToAdd = await this.hsMickaBrowserService.describeWhatToAdd(
        ds,
        layer,
        app
      );
    } else if (ds.type.includes('layman')) {
      whatToAdd = await this.hsLaymanBrowserService.describeWhatToAdd(
        ds,
        layer,
        app
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
        this.datasetSelect('url', app);
      }
      await this.hsAddDataOwsService.connectToOWS(
        {
          type: whatToAdd.type.toLowerCase(),
          uri: decodeURIComponent(whatToAdd.link),
          layer:
            ds.type.includes('layman') || whatToAdd.recordType === 'dataset'
              ? ds.type.includes('layman')
                ? layer.name
                : whatToAdd.name
              : undefined,
        },
        app
      );
    } else if (whatToAdd.type == 'WFS') {
      if (ds.type == 'micka') {
        if (!whatToAdd.workspace) {
          this.datasetSelect('url', app);
        }
        whatToAdd.link = Array.isArray(whatToAdd.link)
          ? whatToAdd.link.filter((link) =>
              link.toLowerCase().includes('wfs')
            )[0]
          : whatToAdd.link;
        await this.hsAddDataOwsService.connectToOWS(
          {
            type: whatToAdd.type.toLowerCase(),
            uri: decodeURIComponent(whatToAdd.link),
            layer: whatToAdd.workspace
              ? `${whatToAdd.workspace}:${whatToAdd.name}`
              : undefined,
            style: whatToAdd.style,
          },
          app
        );
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
            },
            app
          );
          this.hsAddDataVectorService.fitExtent(layer, app);
          this.datasetSelect('catalogue', app);
        } else {
          //Layman layers without write access
          await this.hsAddDataOwsService.connectToOWS(
            {
              type: 'wfs',
              uri: whatToAdd.link.replace('_wms/ows', '/wfs'),
              style: whatToAdd.style,
              layer: `${whatToAdd.workspace}:${whatToAdd.name}`,
            },
            app
          );
        }
        this.hsLayoutService.setMainPanel('layermanager', app);
      }
    } else if (['KML', 'GEOJSON'].includes(whatToAdd.type)) {
      const layer = await this.hsAddDataVectorService.addVectorLayer(
        whatToAdd.type.toLowerCase(),
        whatToAdd.link,
        whatToAdd.name,
        whatToAdd.title,
        whatToAdd.abstract,
        whatToAdd.projection,
        {extractStyles: whatToAdd.extractStyles},
        app
      );
      this.hsAddDataVectorService.fitExtent(layer, app);
    } else if (whatToAdd.type == 'WMTS' && ds.type == 'micka') {
      //Micka only yet
      if (whatToAdd.recordType === 'service') {
        this.datasetSelect('url', app);
      }
      await this.hsAddDataOwsService.connectToOWS(
        {
          type: whatToAdd.type.toLowerCase(),
          uri: decodeURIComponent(whatToAdd.link),
          layer:
            whatToAdd.recordType === 'dataset' ? whatToAdd.name : undefined,
        },
        app
      );
    } else {
      this.hsLayoutService.setMainPanel('layermanager', app);
    }
    return whatToAdd.type;
  }

  datasetSelect(id_selected: DatasetType, app: string): void {
    this.get(app).data.id_selected = id_selected;
    this.hsAddDataService.selectType(id_selected, app);
    this.calcExtentLayerVisibility(app);
  }

  /**
   * Clear the "query" property
   */
  clear(app: string): void {
    const appRef = this.get(app);
    appRef.data.query.textFilter = '';
    appRef.data.query.title = '';
    appRef.data.query.Subject = '';
    appRef.data.query.keywords = '';
    appRef.data.query.OrganisationName = '';
    appRef.data.query.sortby = '';
  }

  calcExtentLayerVisibility(app: string): void {
    this.hsAddDataCatalogueMapService
      .get(app)
      .extentLayer.setVisible(
        this.panelVisible(app) &&
          this.hsAddDataService.get(app).dsSelected == 'catalogue'
      );
  }

  private dataSourceExistsAndEmpty(app: string): boolean {
    return !!this.get(app).endpointsWithDatasources;
  }

  private panelVisible(app: string): boolean {
    return this.hsLayoutService.panelVisible('addData', app);
  }
}
