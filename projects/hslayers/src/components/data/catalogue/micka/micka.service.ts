import Feature from 'ol/Feature';
import {fromExtent as polygonFromExtent} from 'ol/geom/Polygon';
import {transform, transformExtent} from 'ol/proj';

import {HsAddDataLayerDescriptor} from '../add-data-layer-descriptor.interface';
import {HsEndpoint} from '../../../../common/endpoints/endpoint.interface';
import {HsLogService} from '../../../../common/log/log.service';
import {HsMapService} from '../../../map/map.service';
import {HsToastService} from '../../../layout/toast/toast.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {catchError, map, timeout} from 'rxjs/operators';
import {of} from 'rxjs';

@Injectable({providedIn: 'root'})
export class HsMickaBrowserService {
  httpCall;

  constructor(
    private http: HttpClient,
    private log: HsLogService,
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public HsToastService: HsToastService
  ) {}

  /**
   * @function queryCatalog
   * @param {object} dataset Configuration of selected datasource (from app config)
   * @param {object} query Container for all query filter values
   * @param data
   * @param {Function} extentFeatureCreated Function which gets called
   * @param {string} textField Name of the field to search in
   * extent feature is created. Has one parameter: feature
   * @description Loads datasets metadata from selected source (CSW server).
   * Currently supports only "Micka" type of source.
   * Use all query params (search text, bbox, params.., sorting, start)
   */
  queryCatalog(
    dataset: HsEndpoint,
    data,
    extentFeatureCreated,
    textField: string
  ) {
    const url = this.createRequestUrl(dataset, data, textField);
    dataset.datasourcePaging.loaded = false;

    dataset.httpCall = this.http
      .get(url, {
        responseType: 'json',
      })
      .pipe(
        timeout(5000),
        map((x: any) => {
          x.dataset = dataset;
          x.extentFeatureCreated = extentFeatureCreated;
          this.datasetsReceived(x);
          return x;
        }),
        catchError((e) => {
          this.HsToastService.createToastPopupMessage(
            'ADDLAYERS.errorWhileRequestingLayers',
            dataset.title + ': ' + e.message,
            'danger'
          );
          dataset.datasourcePaging.loaded = true;
          return of(e);
        })
      );
    // .subscribe(()=>{console.log('sub')});
    return dataset.httpCall;
  }

  private createRequestUrl(dataset, data, textField) {
    const query = data.query;
    const b = transformExtent(
      this.hsMapService.map
        .getView()
        .calculateExtent(this.hsMapService.map.getSize()),
      this.hsMapService.map.getView().getProjection(),
      'EPSG:4326'
    );
    const bbox = data.filterByExtent ? "BBOX='" + b.join(' ') + "'" : '';
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
    const url =
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
        limit: dataset.datasourcePaging.limit,
        start: dataset.datasourcePaging.start,
      });
    return this.hsUtilsService.proxify(url);
  }

  /**
   * @private
   * @function datasetsReceived
   * @param {Object} data HTTP response containing all the layers
   * @description Callback for catalogue http query
   */
  private datasetsReceived(data): void {
    if (!data.dataset || !data.extentFeatureCreated) {
      return;
    }
    const dataset = data.dataset;
    dataset.loading = false;
    dataset.layers = [];
    dataset.datasourcePaging.loaded = true;
    if (data.records.length == 0) {
      dataset.datasourcePaging.matched = 0;
    } else {
      dataset.datasourcePaging.matched = data.matched;

      dataset.datasourcePaging.next = data.next;
      for (const lyr of data.records) {
        dataset.layers.push(lyr);
        if (data.extentFeatureCreated) {
          const extentFeature = this.addExtentFeature(lyr);
          data.extentFeatureCreated(extentFeature);
        }
      }
    }
  }

  /**
   * @private
   * @function param2Query
   * @param {string} which Parameter name to parse
   * @param {object} query
   * @returns {string}
   * @description Parse query parameter into encoded key value pair.
   */
  private param2Query(which: string, query): string {
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
   * @param {Object} record Record of one dataset from Get Records response
   * @returns {Feature | undefined}
   * @description Create extent features for displaying extent of loaded dataset records in map
   */
  private addExtentFeature(record): Feature | undefined {
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
    const mapProjectionExtent = this.hsMapService.map
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
   * @param {object} layer Micka layer for which to get metadata
   * @returns {string} Url of service or resource
   * @description Get first link from records links array or link
   * property of record in older Micka versions
   * in a common format for use in add-layers component
   */
  getLayerLink(layer): string {
    if (layer.links?.length > 0) {
      if (layer.links[0].url !== undefined) {
        return layer.links[0].url;
      } else {
        return layer.links[0];
      }
    }
    if (layer.link) {
      return layer.link;
    }
    this.log.warn('Layer does not contain any links or link properties');
  }

  /**
   * @function describeWhatToAdd
   * @param {HsEndpoint} ds Configuration of selected datasource (from app config)
   * @param {object} layer Micka layer for which to get metadata
   * @returns {Promise} promise which describes layer
   * in a common format for use in add-layers component
   * @description Gets layer metadata and returns promise which describes layer
   * in a common format for use in add-layers component
   */
  async describeWhatToAdd(
    ds: HsEndpoint,
    layer: HsAddDataLayerDescriptor
  ): Promise<any> {
    let whatToAdd: any = {type: 'none'};
    const type = layer.type || layer.trida;
    const layerLink = this.getLayerLink(layer);
    if (!layerLink) {
      return false;
    }
    if (type == 'service') {
      if (
        layer.serviceType == 'WMS' ||
        layer.serviceType == 'OGC:WMS' ||
        layer.serviceType == 'view'
      ) {
        whatToAdd.type = 'WMS';
        whatToAdd.link = layerLink;
      } else if (layerLink.toLowerCase().includes('sparql')) {
        whatToAdd = {
          type: 'sparql',
          link: layerLink,
          projection: 'EPSG:4326',
        };
      } else if (
        layer.serviceType == 'WFS' ||
        layer.serviceType == 'OGC:WFS' ||
        layer.serviceType == 'download'
      ) {
        whatToAdd.type = 'WFS';
        whatToAdd.link = layerLink;
        whatToAdd.dsType = ds.type;
      } else if (
        layer.formats &&
        ['kml', 'geojson', 'json'].includes(layer.formats[0].toLowerCase())
      ) {
        whatToAdd = {
          type: layer.formats[0].toUpperCase() == 'KML' ? 'kml' : 'geojson',
          link: layerLink,
          projection: 'EPSG:4326',
          extractStyles: layer.formats[0].toLowerCase() == 'kml',
        };
      } else {
        alert(`Service type "${layer.serviceType}" not supported.`);
        return false;
      }
    } else if (type == 'dataset') {
      if (['kml', 'geojson', 'json'].includes(layer.formats[0].toLowerCase())) {
        whatToAdd = {
          type: layer.formats[0].toUpperCase() == 'KML' ? 'kml' : 'geojson',
          link: layerLink,
          projection: 'EPSG:4326',
          extractStyles: layer.formats[0].toLowerCase() == 'kml',
        };
      } else {
        return false;
      }
    } else {
      alert(`Datasource type "${type}" not supported.`);
      return false;
    }
    whatToAdd.title = layer.title || 'Layer';
    whatToAdd.name = layer.title || 'Layer';
    whatToAdd.abstract = layer.abstract || 'Layer';
    return whatToAdd;
  }
}
