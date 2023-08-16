import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Observable, catchError, map, of, timeout} from 'rxjs';

import {HsCompositionsParserService} from '../compositions-parser.service';
import {HsEndpoint} from './../../../common/endpoints/endpoint.interface';
import {HsLanguageService} from '../../language/language.service';
import {HsLogService} from '../../../common/log/log.service';
import {HsMapCompositionDescriptor} from '../models/composition-descriptor.model';
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
    private hsLanguageService: HsLanguageService,
    private hsLog: HsLogService,
    private hsCompositionsParserService: HsCompositionsParserService,
  ) {}

  /**
   * Get Micka compositions query URL
   * @param endpoint - Micka endpoint selected
   * @param params - HTTP request query params
   * @param bbox - Bounding box
   */
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
    const serviceTypeFilter =
      ' AND (serviceType like "Map" OR serviceType like "CSW" OR serviceType like "WMC")';
    const textFilter =
      query && query.title !== undefined && query.title != ''
        ? encodeURIComponent(
            " AND (title like '*" +
              query.title +
              "*' OR abstract like '*" +
              query.title +
              "*')",
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
      serviceTypeFilter +
      textFilter +
      keywordFilter +
      '&lang=eng&sortBy=' +
      params.sortBy +
      '&detail=summary&start=' +
      params.start +
      '&limit=' +
      params.limit;
    tmp = this.hsUtilsService.proxify(tmp);
    return tmp;
  }

  /**
   * Middleware function before returning compositions list to the rest of the app
   * @param endpoint - Micka endpoint selected
   * @param response - HTTP request response
   */
  compositionsReceived(endpoint: HsEndpoint, response: any): void {
    if (!response.records) {
      this.hsToastService.createToastPopupMessage(
        this.hsLanguageService.getTranslation('COMMON.warning', undefined),
        endpoint.title +
          ': ' +
          this.hsLanguageService.getTranslation(
            'COMMON.noDataReceived',
            undefined,
          ),
        {
          disableLocalization: true,
          toastStyleClasses: 'bg-warning text-light',
          serviceCalledFrom: 'HsCompositionsMickaService',
        },
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
          this.hsMapService.getCurrentProj(),
        );
        if (extentFeature) {
          record.featureId = extentFeature.getId().toString();
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
   */
  loadList(
    endpoint: HsEndpoint,
    params: any,
    extentFeatureCreated,
    bbox: any,
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
          this.hsToastService.createToastPopupMessage(
            this.hsLanguageService.getTranslation(
              'COMPOSITIONS.errorWhileRequestingCompositions',
              undefined,
            ),
            endpoint.title +
              ': ' +
              this.hsLanguageService.getTranslationIgnoreNonExisting(
                'ERRORMESSAGES',
                e.status ? e.status.toString() : e.message,
                {url: url},
              ),
            {
              disableLocalization: true,
              serviceCalledFrom: 'HsCompositionsMickaService',
            },
          );
          return of(e);
        }),
      );

    return endpoint.httpCall;
  }

  /**
   * Reset Micka composition paging values
   * @param endpoint - Micka endpoint selected
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

  /**
   * Get information about the selected composition
   * @param composition - Composition selected
   */
  async getInfo(composition: HsMapCompositionDescriptor): Promise<any> {
    const compLinks = composition.link || composition.links;
    if (compLinks === undefined) {
      return;
    }
    const compUrls = this.getCompositionUrls(compLinks);
    let info: any = {};
    const url = Array.isArray(compUrls) ? compUrls[0] : compUrls;
    try {
      info = await this.hsCompositionsParserService.loadInfo(url);
      //TODO: find out if this is even available
      // info.thumbnail = this.HsUtilsService.proxify(composition.thumbnail);
      info.metadata = {
        record_url:
          composition.endpoint.url.replace('csw', 'record/basic/') +
          composition.id,
      };
      return info;
    } catch (e) {
      this.hsToastService.createToastPopupMessage(
        this.hsLanguageService.getTranslation(
          'COMPOSITIONS.errorWhileLoadingCompositionMetadata',
          undefined,
        ),
        this.hsLanguageService.getTranslationIgnoreNonExisting(
          'ERRORMESSAGES',
          e.status ? e.status.toString() : e.message,
          {url: url},
        ),
        {
          disableLocalization: true,
          serviceCalledFrom: 'HsCompositionsMickaService',
        },
      );
    }
  }

  /**
   * Get composition URLs
   * @param compData - Composition data
   */
  getCompositionUrls(compData: any): string | Array<string> {
    if (typeof compData == 'string') {
      return compData;
    }
    if (typeof compData == 'object' && compData.url !== undefined) {
      return compData.url;
    }
    return compData.map((link) =>
      typeof link == 'object' && link.url !== undefined ? link.url : link,
    );
  }

  /**
   * Method is not implemented as it is not desired to delete Micka records from HSLayers application.
   * The deletion shall be done automatically by Layman or, in rare scenarios, manually via Micka UI.
   * See https://github.com/hslayers/hslayers-ng/pull/4014
   */
  delete(e: HsEndpoint, c: HsMapCompositionDescriptor) {
    this.hsLog.warn(
      'Delete method for Micka compositions not implemented',
      e,
      c,
    );
  }
}
