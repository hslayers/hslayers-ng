import * as angular from 'angular';
import Feature from 'ol/Feature';
import {fromExtent as polygonFromExtent} from 'ol/geom/Polygon';
import {transform, transformExtent} from 'ol/proj';

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {HsLogService} from '../../../common/log/log.service';
import {HsMapService} from '../../map/map.service';
import {HsMickaFilterService} from './micka-filters.service';
import {HsUtilsService} from '../../utils/utils.service';

@Injectable({providedIn: 'root'})
export class HsMickaBrowserService {
  /**
   * @param HsMapService
   * @param $http
   * @param $q
   * @param HsUtilsService
   * @param HsMickaFiltersService
   * @param $log
   */
  constructor(
    private http: HttpClient,
    private log: HsLogService,
    private hsMapService: HsMapService,
    private hsMickaFilterService: HsMickaFilterService,
    private hsUtilsService: HsUtilsService
  ) {}

  /**
   * @function queryCatalog
   * @memberof HsMickaBrowserService
   * @param {object} dataset Configuration of selected datasource (from app config)
   * @param {object} query Container for all query filter values
   * @param {Function} extentFeatureCreated Function which gets called
   * @param {string} textField Name of the field to search in
   * extent feature is created. Has one parameter: feature
   * @description Loads datasets metadata from selected source (CSW server).
   * Currently supports only "Micka" type of source.
   * Use all query params (search text, bbox, params.., sorting, start)
   */
  queryCatalog(
    dataset: HsEndpoint,
    query,
    extentFeatureCreated,
    textField: string
  ): void {
    const b = transformExtent(
      this.hsMapService.map
        .getView()
        .calculateExtent(HsMapService.map.getSize()),
      this.hsMapService.map.getView().getProjection(),
      'EPSG:4326'
    );
    const bbox = this.hsMickaFilterService.filterByExtent
      ? "BBOX='" + b.join(' ') + "'"
      : '';
    const text =
      query.textFilter !== undefined && query.textFilter.length > 0
        ? query.textFilter
        : query.title;
    const sql = [
      text != '' ? `${textField} like '*${text}*'` : '',
      bbox,
      //param2Query('type'),
      this.param2Query('ServiceType', query),
      this.param2Query('topicCategory', query),
      this.param2Query('Subject', query),
      this.param2Query('Denominator', query),
      this.param2Query('OrganisationName', query),
      this.param2Query('keywords', query),
    ]
      .filter((n) => {
        return n != '';
      })
      .join(' AND ');
    let url =
      dataset.url +
      '?' +
      this.hsUtilsService.paramsToURL({
        request: 'GetRecords',
        format: 'application/json',
        language: dataset.language,
        query: sql,
        sortby:
          query.sortby !== undefined && query.sortby != ''
            ? query.sortby
            : 'title',
        limit: dataset.paging.itemsPerPage,
        start: dataset.datasourcePaging.start,
      });
    url = this.hsUtilsService.proxify(url);
    dataset.datasourcePaging.loaded = false;
    /*if (dataset.canceler !== undefined) {
      dataset.canceler.resolve();
      delete dataset.canceler;
    }*/
    //dataset.canceler = $q.defer();
    this.http
      .get(url, {
        //timeout: dataset.canceler.promise,
        //dataset,
        //extentFeatureCreated,
        responseType: 'json',
      })
      .toPromise()
      .then(this.datasetsReceived, (e) => {
        dataset.datasourcePaging.loaded = true;
      });
  }

  /**
   * @private
   * @function datasetsReceived
   * @memberof HsMickaBrowserService
   * @param {Object} j HTTP response containing all the layers
   * (PRIVATE) Callback for catalogue http query
   */
  datasetsReceived(j): void {
    const dataset = j.config.dataset;
    const extentFeatureCreated = j.config.extentFeatureCreated;
    dataset.loading = false;
    dataset.layers = [];
    dataset.datasourcePaging.loaded = true;
    if (j.data === null) {
      dataset.datasourcePaging.matched == 0;
    } else {
      j = j.data;
      dataset.datasourcePaging.matched = j.matched;
      dataset.datasourcePaging.next = j.next;
      for (const lyr in j.records) {
        if (j.records[lyr]) {
          const obj = j.records[lyr];
          dataset.layers.push(obj);
          if (extentFeatureCreated) {
            extentFeatureCreated(this.addExtentFeature(obj));
          }
        }
      }
    }
  }

  /**
   * @private
   * @function param2Query
   * @memberof HsMickaBrowserService
   * @param {String} which Parameter name to parse
   * (PRIVATE) Parse query parameter into encoded key value pair.
   */
  param2Query(which: string, query): string {
    if (query[which] !== undefined) {
      if (which == 'type' && query[which] == 'data') {
        //Special case for type 'data' because it can contain many things
        return "(type='dataset' OR type='nonGeographicDataset' OR type='series' OR type='tile')";
      }
      return query[which] != '' ? which + "='" + query[which] + "'" : '';
    } else {
      if (which == 'ServiceType') {
        return '(ServiceType=view OR ServiceType=download OR ServiceType=WMS OR ServiceType=WFS)';
      } else {
        return '';
      }
    }
  }

  /**
   * @private
   * @function addExtentFeature
   * @memberof HsMickaBrowserService
   * @param {Object} record Record of one dataset from Get Records response
   * (PRIVATE) Create extent features for displaying extent of loaded dataset records in map
   */
  addExtentFeature(record): Feature | undefined {
    const attributes = {
      record: record,
      hs_notqueryable: true,
      highlighted: false,
      title: record.title || record.name,
      geometry: null,
    };
    let b = null;
    if (typeof record.bbox === 'string') {
      b = record.bbox.split(' ');
    } else if (Array.isArray(record.bbox)) {
      b = record.bbox;
    }
    let first_pair = [parseFloat(b[0]), parseFloat(b[1])];
    let second_pair = [parseFloat(b[2]), parseFloat(b[3])];
    const mapProjectionExtent = HsMapService.map
      .getView()
      .getProjection()
      .getExtent();
    first_pair = transform(
      first_pair,
      'EPSG:4326',
      this.hsMapService.map.getView().getProjection()
    );
    second_pair = transform(
      second_pair,
      'EPSG:4326',
      this.hsMapService.map.getView().getProjection()
    );
    if (!isFinite(first_pair[0])) {
      first_pair[0] = mapProjectionExtent[0];
    }
    if (!isFinite(first_pair[1])) {
      first_pair[1] = mapProjectionExtent[1];
    }
    if (!isFinite(second_pair[0])) {
      second_pair[0] = mapProjectionExtent[2];
    }
    if (!isFinite(second_pair[1])) {
      second_pair[1] = mapProjectionExtent[3];
    }
    if (
      isNaN(first_pair[0]) ||
      isNaN(first_pair[1]) ||
      isNaN(second_pair[0]) ||
      isNaN(second_pair[1])
    ) {
      return;
    }
    const extent = [
      first_pair[0],
      first_pair[1],
      second_pair[0],
      second_pair[1],
    ];
    attributes.geometry = polygonFromExtent(extent);
    const new_feature = new Feature(attributes);
    record.feature = new_feature;
    return new_feature;
  }

  /**
   * @function getLayerLink
   * @memberof HsMickaBrowserService
   * @param {object} layer Micka layer for which to get metadata
   * @description Get first link from records links array or link
   * property of record in older Micka versions
   * in a common format for use in add-layers component
   * @returns {string} Url of service or resource
   */
  getLayerLink(layer): string {
    if (layer?.links?.length > 0) {
      if (layer.links[0].url !== undefined) {
        return layer.links[0].url;
      } else {
        return layer.links[0];
      }
    }
    if (layer.link) {
      return layer.link;
    }
    this.log.warn('Layer did not contain any links or link properties');
  }

  /**
   * @function describeWhatToAdd
   * @memberof HsMickaBrowserService
   * @param {object} ds Configuration of selected datasource (from app config)
   * @param {object} layer Micka layer for which to get metadata
   * @description Gets layer metadata and returns promise which describes layer
   * in a common format for use in add-layers component
   * @returns {Promise} promise which describes layer
   * in a common format for use in add-layers component
   */
  describeWhatToAdd(ds, layer): Promise<any> {
    let whatToAdd: any = {type: 'none'};
    const type = layer.type || layer.trida;
    return new Promise((resolve, reject) => {
      if (type == 'service') {
        if (
          layer.serviceType == 'WMS' ||
          layer.serviceType == 'OGC:WMS' ||
          layer.serviceType == 'view'
        ) {
          whatToAdd.type = 'WMS';
          whatToAdd.link = this.getLayerLink(layer);
        } else if (this.getLayerLink(layer).toLowerCase().includes('sparql')) {
          whatToAdd = {
            type: 'sparql',
            link: this.getLayerLink(layer),
            title: layer.title || 'Layer',
            abstract: layer.abstract || 'Layer',
            projection: 'EPSG:4326',
          };
        } else if (
          layer.serviceType == 'WFS' ||
          layer.serviceType == 'OGC:WFS' ||
          layer.serviceType == 'download'
        ) {
          whatToAdd.type = 'WFS';
          whatToAdd.link = this.getLayerLink(layer);
        } else if (
          layer.formats &&
          ['kml', 'geojson', 'json'].includes(layer.formats[0].toLowerCase())
        ) {
          whatToAdd = {
            type: layer.formats[0].toUpperCase() == 'KML' ? 'kml' : 'geojson',
            link: this.getLayerLink(layer),
            title: layer.title || 'Layer',
            abstract: layer.abstract || 'Layer',
            projection: 'EPSG:4326',
            extractStyles: layer.formats[0].toLowerCase() == 'kml',
          };
        } else {
          alert('Service type "' + layer.serviceType + '" not supported.');
          reject();
          return;
        }
      } else if (type == 'dataset') {
        if (
          ['kml', 'geojson', 'json'].indexOf(layer.formats[0].toLowerCase()) >
          -1
        ) {
          whatToAdd = {
            type: layer.formats[0].toUpperCase() == 'KML' ? 'kml' : 'geojson',
            link: this.getLayerLink(layer),
            title: layer.title || 'Layer',
            abstract: layer.abstract || 'Layer',
            projection: 'EPSG:4326',
            extractStyles: layer.formats[0].toLowerCase() == 'kml',
          };
        } else {
          reject();
          return;
        }
      } else {
        alert(`Datasource type "${type}" not supported.`);
        reject();
        return;
      }
      resolve(whatToAdd);
    });
  }
}
