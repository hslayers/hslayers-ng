import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Observable, of} from 'rxjs';
import {catchError, map, timeout} from 'rxjs/operators';

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
  constructor(
    private $http: HttpClient,
    private hsMapService: HsMapService,
    private hsUtilsService: HsUtilsService,
    private hsToastService: HsToastService,
    private hsLanguageService: HsLanguageService
  ) {}

  /**
   * Get Micka compositions query url
   * @param endpoint - Micka endpoint selected
   * @param params - HTTP request query params
   * @param bbox - Bounding box
   * @param app - App identifier
   */
  getCompositionsQueryUrl(endpoint, params, bbox, app: string): string {
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
    tmp = this.hsUtilsService.proxify(tmp, app);
    return tmp;
  }
  /**
   * Middleware function before returning compositions list to the rest of the app
   * @param endpoint - Micka endpoint selected
   * @param response - HTTP request response
   * @param app - App identifier
   */
  compositionsReceived(endpoint: HsEndpoint, response: any, app: string): void {
    if (!response.records) {
      this.hsToastService.createToastPopupMessage(
        this.hsLanguageService.getTranslation('COMMON.warning'),
        endpoint.title +
          ': ' +
          this.hsLanguageService.getTranslation('COMMON.noDataReceived'),
        app,
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
          this.hsMapService.getCurrentProj(app)
        );
        if (extentFeature) {
          record.featureId = extentFeature.getId();
          response.extentFeatureCreated(extentFeature);
        }
      }
    }
  }

  /**
   * Load composition list from the external Micka server
   * @param endpoint - Micka endpoint selected
   * @param params - HTTP request query params
   * @param extentFeatureCreated - Function for creating extent vector feature that will reference all listed composition from the response
   * @param bbox - Bounding box
   * @param app - App identifier
   */
  loadList(
    endpoint: HsEndpoint,
    params: any,
    extentFeatureCreated,
    bbox: any,
    app: string
  ): Observable<any> {
    params = this.checkForParams(endpoint, params);
    const url = this.getCompositionsQueryUrl(endpoint, params, bbox, app);
    endpoint.compositionsPaging.loaded = false;

    endpoint.httpCall = this.$http
      .get(url, {
        responseType: 'json',
      })
      .pipe(
        timeout(5000),
        map((response: any) => {
          response.extentFeatureCreated = extentFeatureCreated;
          this.compositionsReceived(endpoint, response, app);
        }),
        catchError((e) => {
          this.hsToastService.createToastPopupMessage(
            this.hsLanguageService.getTranslation(
              'COMPOSITIONS.errorWhileRequestingCompositions'
            ),
            endpoint.title +
              ': ' +
              this.hsLanguageService.getTranslationIgnoreNonExisting(
                'ERRORMESSAGES',
                e.status ? e.status.toString() : e.message,
                {url: url}
              ),
            app,
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

  /**
   * Reset Micka composition paging values
   * @param endpoint - Micka endpoint selected
   * @param app - App identifier
   */
  resetCompositionCounter(endpoint) {
    endpoint.compositionsPaging.start = 0;
    endpoint.compositionsPaging.next = endpoint.compositionsPaging.limit;
    endpoint.compositionsPaging.matched = 0;
  }

  /**
   * Check if query params are correct and defined
   * @param endpoint - Micka endpoint selected
   * @param params - HTTP request query params
   */
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
