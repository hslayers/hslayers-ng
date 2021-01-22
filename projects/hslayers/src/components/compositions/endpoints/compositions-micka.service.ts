import {HsEndpoint} from './../../../common/endpoints/endpoint.interface';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import Feature from 'ol/Feature';
import {fromExtent as polygonFromExtent} from 'ol/geom/Polygon';

import {HsCompositionsParserService} from '../compositions-parser.service';
import {HsLogService} from '../../../common/log/log.service';
import {HsMapService} from '../../map/map.service';
import {HsUtilsService} from '../../utils/utils.service';
import {Observable, Subscription, of} from 'rxjs';
import {catchError, map, timeout} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsMickaService {
  listLoading: Subscription;
  constructor(
    public HsCompositionsParserService: HsCompositionsParserService,
    private $http: HttpClient,
    public HsMapService: HsMapService,
    public HsUtilsService: HsUtilsService,
    public HsLogService: HsLogService
  ) {}

  getCompositionsQueryUrl(endpoint, params, bbox): string {
    const query = params.query;
    const bboxDelimiter =
      endpoint.url.indexOf('cswClientRun.php') > 0 ? ',' : ' ';
    const serviceName =
      endpoint.serviceName !== undefined
        ? 'serviceName=&' + endpoint.serviceName
        : '';
    bbox = params.filterExtent
      ? encodeURIComponent(" and BBOX='" + bbox.join(bboxDelimiter) + "'")
      : '';
    const textFilter =
      query && query.title !== undefined && query.title != ''
        ? encodeURIComponent(
            " AND title like '*" +
              query.title +
              "*' OR abstract like '*" +
              query.title +
              "*'"
          )
        : '';
    const selected = [];
    let keywordFilter = '';
    let tmp = endpoint.url;
    for (const key of params.keywords) {
      if (key.selected) {
        selected.push("Subject='" + key.value + "'");
      }
    }
    for (const theme of params.themes) {
      if (theme.selected) {
        selected.push("Subject='" + theme.value + "'");
      }
    }
    if (selected.length > 0) {
      keywordFilter = encodeURIComponent(' AND ' + selected.join(' OR '));
    }

    tmp +=
      '?format=json&' +
      serviceName +
      'query=type%3D' +
      params.type +
      bbox +
      textFilter +
      keywordFilter +
      '&lang=eng&sortBy=' +
      params.sortBy +
      '&detail=summary&start=' +
      params.start +
      '&limit=' +
      params.limit;
    tmp = this.HsUtilsService.proxify(tmp);
    return tmp;
  }
  compositionsReceived(
    endpoint: HsEndpoint,
    extentLayer: any,
    response: any
  ): HsEndpoint {
    if (!response.records) {
      this.HsLogService.error('No data received');
      return;
    }
    endpoint.compositionsPaging.loaded = true;
    endpoint.compositions = response.records;
    if (response.records && response.records.length > 0) {
      endpoint.compositionsPaging.matched = response.matched;
    } else {
      endpoint.compositionsPaging.matched = 0;
    }
    //TODO: Needs refactoring
    endpoint.compositionsPaging.next = response.next;
    const mapExtent = this.HsMapService.getMapExtent();
    for (const record of endpoint.compositions) {
      const attributes: any = {
        record: record,
        hs_notqueryable: true,
        highlighted: false,
        title: record.title || record.name,
      };
      record.editable = false;
      record.endpoint = endpoint;
      if (record.thumbnail == undefined) {
        record.thumbnail = endpoint.url + '?request=loadthumb&id=' + record.id;
      }
      let extent = this.HsCompositionsParserService.parseExtent(
        record.bbox || ['180', '180', '180', '180']
      );
      extent = this.HsCompositionsParserService.transformExtent(extent);
      //Check if height or Width covers the whole screen
      if (
        extent &&
        !(
          (extent[0] < mapExtent[0] && extent[2] > mapExtent[2]) ||
          (extent[1] < mapExtent[1] && extent[3] > mapExtent[3])
        )
      ) {
        attributes.geometry = polygonFromExtent(extent);
        attributes.is_hs_composition_extent = true;
        const newFeature = new Feature(attributes);
        record.feature = newFeature;
        extentLayer.getSource().addFeatures([newFeature]);
      } else {
        //Composition not in extent
      }
    }
    return endpoint;
  }

  loadList(
    endpoint: HsEndpoint,
    params: any,
    bbox: any,
    extentLayer: any
  ): Observable<any> {
    params = this.checkForParams(endpoint, params);
    const url = this.getCompositionsQueryUrl(endpoint, params, bbox);
    endpoint.compositionsPaging.loaded = false;

    endpoint.httpCall = this.$http
      .get(url, {
        responseType: 'json',
      })
      .pipe(
        timeout(1000),
        map((response: any) => {
          const ep = this.compositionsReceived(endpoint, extentLayer, response);
          return ep;
        }),
        catchError((e) => {
          this.HsLogService.error(e);
          endpoint.datasourcePaging.loaded = true;
          return of(e);
        })
      );

    return endpoint.httpCall;
  }

  resetCompositionCounter(endpoint) {
    endpoint.compositionsPaging.start = 0;
    endpoint.compositionsPaging.next = endpoint.compositionsPaging.limit;
    endpoint.compositionsPaging.matched = 0;
  }
  checkForParams(endpoint: HsEndpoint, params: any): any {
    if (params.sortBy == undefined || params.sortBy === 'None') {
      params.sortBy = 'title';
    }
    if (params.type == undefined || params.type === 'None') {
      params.type = 'application';
    }
    if (params.theme == undefined || params.theme === 'None') {
      params.theme = '';
    }
    if (params.start == undefined) {
      params.start = endpoint.compositionsPaging.start;
    }
    if (params.limit == undefined || isNaN(params.limit)) {
      params.limit = endpoint.compositionsPaging.limit;
    }
    return params;
  }
}
