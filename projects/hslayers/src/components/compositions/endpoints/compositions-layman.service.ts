import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError, map, timeout} from 'rxjs/operators';
import {transformExtent} from 'ol/proj';

import {
  EndpointErrorHandler,
  EndpointErrorHandling,
  HsEndpoint,
  isErrorHandlerFunction,
} from '../../../common/endpoints/endpoint.interface';
import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../../common/layman/layman.service';
import {HsCompositionsParserService} from '../compositions-parser.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLanguageService} from '../../language/language.service';
import {HsMapService} from '../../map/map.service';
import {HsToastService} from '../../layout/toast/toast.service';
import {HsUtilsService} from '../../utils/utils.service';
import {addExtentFeature} from '../../../common/extent-utils';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsLaymanService {
  data: any = {};
  constructor(
    private $http: HttpClient,
    public hsUtilsService: HsUtilsService,
    public hsCommonLaymanService: HsCommonLaymanService,
    public hsCompositionsParserService: HsCompositionsParserService,
    public hsEventBusService: HsEventBusService,
    public hsToastService: HsToastService,
    public hsLanguageService: HsLanguageService,
    public hsMapService: HsMapService,
    public hsCommonEndpointsService: HsCommonEndpointsService
  ) {}

  loadList(
    endpoint: HsEndpoint,
    params,
    extentFeatureCreated
  ): Observable<any> {
    endpoint.getCurrentUserIfNeeded(endpoint);
    endpoint.compositionsPaging.loaded = false;

    const query = params.query.title ? params.query.title : '';
    const sortBy =
      params.sortBy == 'date:D'
        ? 'last_change'
        : params.sortBy !== undefined && params.sortBy != 'None' //Set by date by default, was requested long time ago
        ? params.sortBy
        : 'last_change';

    const b = transformExtent(
      this.hsMapService.map
        .getView()
        .calculateExtent(this.hsMapService.map.getSize()),
      this.hsMapService.getCurrentProj(),
      'EPSG:3857'
    );
    const bbox = params.filterByExtent ? b.join(',') : '';

    const withPermissionOrMine = params.filterByOnlyMine
      ? endpoint.user !== 'anonymous' && endpoint.user !== 'browser'
        ? `workspaces/${endpoint.user}/`
        : ''
      : '';
    const url = `${endpoint.url}/rest/${withPermissionOrMine}maps`;

    endpoint.listLoading = this.$http
      .get(url, {
        observe: 'response',
        withCredentials: true,
        params: {
          'limit': `${endpoint.compositionsPaging.limit}`,
          'offset': `${endpoint.compositionsPaging.start}`,
          'full_text_filter': `${query}`,
          'order_by': `${sortBy}`,
          'bbox_filter': `${bbox}`,
        },
      })
      .pipe(
        timeout(5000),
        map((response: any) => {
          if (Array.isArray(response.body)) {
            response.body.extentFeatureCreated = extentFeatureCreated;
            this.compositionsReceived(endpoint, response);
          } else {
            this.hsCommonLaymanService.displayLaymanError(
              endpoint,
              'COMPOSITIONS.errorWhileRequestingCompositions',
              response.body
            );
          }
        }),
        catchError((e) => {
          if (isErrorHandlerFunction(endpoint.onError?.compositionLoad)) {
            (<EndpointErrorHandler>endpoint.onError?.compositionLoad).handle(
              endpoint,
              e
            );
            return of(e);
          }
          switch (endpoint.onError?.compositionLoad) {
            case EndpointErrorHandling.ignore:
              break;
            case EndpointErrorHandling.toast:
            default:
              this.hsToastService.createToastPopupMessage(
                this.hsLanguageService.getTranslation(
                  'COMPOSITIONS.errorWhileRequestingCompositions'
                ),
                endpoint.title +
                  ': ' +
                  this.hsLanguageService.getTranslationIgnoreNonExisting(
                    'ERRORMESSAGES',
                    e.status ? e.status.toString() : e.message,
                    {url: endpoint.url}
                  ),
                {
                  disableLocalization: true,
                  serviceCalledFrom: 'HsCompositionsLaymanService',
                }
              );
              break;
          }
          return of(e);
        })
      );
    return endpoint.listLoading;
  }
  compositionsReceived(endpoint: HsEndpoint, response): void {
    if (response.body.length == 0) {
      endpoint.compositionsPaging.matched = 0;
      this.displayWarningToast(endpoint, 'COMMON.noDataReceived');
      return;
    }
    endpoint.compositionsPaging.loaded = true;
    endpoint.compositionsPaging.matched = response.headers.get('x-total-count') // in case response is an error, x-total-count will return null, it must be checked
      ? parseInt(response.headers.get('x-total-count'))
      : response.body.length;

    endpoint.compositions = response.body.map((record) => {
      const tmp = {
        name: record.name,
        title: record.title,
        access_rights: record.access_rights,
        featureId: undefined,
        highlighted: false,
        editable: record.access_rights.write.some((user) => {
          return [endpoint.user, 'EVERYONE'].includes(user);
        }),
        url: `${endpoint.url}/rest/workspaces/${record.workspace}/maps/${record.name}`,
        endpoint,
        workspace: record.workspace,
        id: `m-${record.uuid}`, //m-* to match micka's id structure.
      };
      if (response.body.extentFeatureCreated) {
        const extentFeature = addExtentFeature(
          record,
          this.hsMapService.getCurrentProj()
        );
        if (extentFeature) {
          tmp.featureId = extentFeature.getId();
          response.body.extentFeatureCreated(extentFeature);
        }
      }

      return tmp;
    });
  }
  async delete(endpoint: HsEndpoint, composition): Promise<void> {
    const url = `${endpoint.url}/rest/workspaces/${composition.workspace}/maps/${composition.name}`;
    await this.$http.delete(url, {withCredentials: true}).toPromise();
    this.hsEventBusService.compositionDeletes.next(composition);
  }

  async getInfo(composition: any): Promise<any> {
    const endpoint = composition.endpoint
    if (composition.name == undefined) {
      this.displayWarningToast(
        endpoint,
        'COMPOSITIONS.compostionsNameAttributeIsNotDefined'
      );
      return;
    }
    if (endpoint.user == undefined) {
      this.displayWarningToast(
        endpoint,
        'COMPOSITIONS.endpointUserIsNotDefined'
      );
      return;
    }
    if (endpoint.url == undefined) {
      this.displayWarningToast(
        endpoint,
        'COMPOSITIONS.endpointUrlIsNotDefined'
      );
      return;
    }
    const url = `${endpoint.url}/rest/workspaces/${composition.workspace}/maps/${composition.name}`;
    const info = await this.hsCompositionsParserService.loadInfo(url);
    if (
      info.thumbnail?.status !== undefined &&
      info.thumbnail?.status == 'NOT_AVAILABLE'
    ) {
      delete info.thumbnail;
    }
    info.abstract = info.description;
    return info;
  }

  resetCompositionCounter(endpoint: HsEndpoint): void {
    endpoint.compositionsPaging.start = 0;
    endpoint.compositionsPaging.next = this.data.limit;
    endpoint.compositionsPaging.matched = 0;
  }
  displayWarningToast(endpoint: HsEndpoint, message: string): void {
    this.hsToastService.createToastPopupMessage(
      this.hsLanguageService.getTranslation('COMMON.warning'),
      endpoint.title + ': ' + this.hsLanguageService.getTranslation(message),
      {
        disableLocalization: true,
        toastStyleClasses: 'bg-warning text-light',
        serviceCalledFrom: 'HsCompositionsLaymanService',
      }
    );
  }
}
