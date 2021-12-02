import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Observable, Subscription, of} from 'rxjs';
import {catchError, map, timeout} from 'rxjs/operators';

import {HsCompositionsParserService} from '../compositions-parser.service';
import {HsEndpoint} from './../../../common/endpoints/endpoint.interface';
import {HsLanguageService} from '../../language/language.service';
import {HsMapService} from '../../map/map.service';
import {HsToastService} from '../../layout/toast/toast.service';
import {HsUtilsService} from '../../utils/utils.service';
import {addExtentFeature} from '../../../common/extent-utils';

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
    public HsToastService: HsToastService,
    public HsLanguageService: HsLanguageService
  ) {}

  getCompositionsQueryUrl(endpoint, params, bbox): string {
    const query = params.query;
    const bboxDelimiter =
      endpoint.url.indexOf('cswClientRun.php') > 0 ? ',' : ' ';
    const serviceName =
      endpoint.serviceName !== undefined
        ? 'serviceName=&' + endpoint.serviceName
        : '';
    bbox = params.filterByExtent
      ? encodeURIComponent(" and BBOX='" + bbox.join(bboxDelimiter) + "'")
      : '';
    const textFilter =
      query && query.title !== undefined && query.title != ''
        ? encodeURIComponent(
            " AND (title like '*" +
              query.title +
              "*' OR abstract like '*" +
              query.title +
              "*')"
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
  compositionsReceived(endpoint: HsEndpoint, response: any): void {
    if (!response.records) {
      this.HsToastService.createToastPopupMessage(
        this.HsLanguageService.getTranslation('COMMON.warning'),
        endpoint.title +
          ': ' +
          this.HsLanguageService.getTranslation('COMMON.noDataReceived'),
        {
          disableLocalization: true,
          toastStyleClasses: 'bg-warning text-light',
          serviceCalledFrom: 'HsCompositionsMickaService',
        }
      );
      return;
    }
    endpoint.compositionsPaging.loaded = true;
    endpoint.compositions = response.records;
    if (response.records && response.records.length > 0) {
      endpoint.compositionsPaging.matched = response.matched;
    } else {
      endpoint.compositionsPaging.matched = 0;
    }
    endpoint.compositionsPaging.next = response.next;
    for (const record of endpoint.compositions) {
      record.editable = false;
      record.endpoint = endpoint;
      if (record.thumbnail == undefined) {
        record.thumbnail = endpoint.url + '?request=loadthumb&id=' + record.id;
      }
      if (response.extentFeatureCreated) {
        const extentFeature = addExtentFeature(
          record,
          this.HsMapService.getCurrentProj()
        );
        if (extentFeature) {
          record.featureId = extentFeature.getId();
          response.extentFeatureCreated(extentFeature);
        }
      }
    }
  }

  loadList(
    endpoint: HsEndpoint,
    params: any,
    extentFeatureCreated,
    bbox: any
  ): Observable<any> {
    params = this.checkForParams(endpoint, params);
    const url = this.getCompositionsQueryUrl(endpoint, params, bbox);
    endpoint.compositionsPaging.loaded = false;

    endpoint.httpCall = this.$http
      .get(url, {
        responseType: 'json',
      })
      .pipe(
        timeout(5000),
        map((response: any) => {
          response.extentFeatureCreated = extentFeatureCreated;
          this.compositionsReceived(endpoint, response);
        }),
        catchError((e) => {
          this.HsToastService.createToastPopupMessage(
            this.HsLanguageService.getTranslation(
              'COMPOSITIONS.errorWhileRequestingCompositions'
            ),
            endpoint.title +
              ': ' +
              this.HsLanguageService.getTranslationIgnoreNonExisting(
                'ERRORMESSAGES',
                e.status ? e.status.toString() : e.message,
                {url: url}
              ),
            {
              disableLocalization: true,
              serviceCalledFrom: 'HsCompositionsMickaService',
            }
          );
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
      params.sortBy = 'date:D';
    }
    if (params.type == undefined || params.type === 'None') {
      params.type = 'application';
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
