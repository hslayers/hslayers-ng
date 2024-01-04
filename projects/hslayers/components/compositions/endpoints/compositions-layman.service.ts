import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Observable, catchError, lastValueFrom, map, of, timeout} from 'rxjs';
import {transformExtent} from 'ol/proj';

import {
  EndpointErrorHandler,
  EndpointErrorHandling,
  HsEndpoint,
  isErrorHandlerFunction,
} from 'hslayers-ng/shared/endpoints';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsCompositionsParserService} from '../compositions-parser.service';
import {HsEventBusService} from 'hslayers-ng/shared/core';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsMapCompositionDescriptor} from '../models/composition-descriptor.model';
import {HsMapService} from 'hslayers-ng/components/map';
import {HsToastService} from 'hslayers-ng/common/toast';
import {addExtentFeature} from 'hslayers-ng/common/utils';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsLaymanService {
  constructor(
    private $http: HttpClient,
    private hsCommonLaymanService: HsCommonLaymanService,
    private hsCompositionsParserService: HsCompositionsParserService,
    private hsEventBusService: HsEventBusService,
    private hsToastService: HsToastService,
    private hsLanguageService: HsLanguageService,
    private hsMapService: HsMapService,
  ) {}

  /**
   * Load composition list from the external Layman server
   * @param endpoint - Layman endpoint selected
   * @param params - HTTP request query params
   * @param extentFeatureCreated - Function for creating extent vector feature that will reference all listed composition from the response
   * @param _bbox - Bounding box
   */
  loadList(
    endpoint: HsEndpoint,
    params,
    extentFeatureCreated,
    _bbox,
  ): Observable<any> {
    endpoint.getCurrentUserIfNeeded(endpoint);
    endpoint.compositionsPaging.loaded = false;
    const loggedIn = endpoint.authenticated;
    const query = params.query.title ? params.query.title : '';
    const sortBy =
      params.sortBy == 'date:D'
        ? 'last_change'
        : params.sortBy !== undefined && params.sortBy != 'None' //Set by date by default, was requested long time ago
        ? params.sortBy
        : 'last_change';

    const b = transformExtent(
      this.hsMapService
        .getMap()
        .getView()
        .calculateExtent(this.hsMapService.getMap().getSize()),
      this.hsMapService.getCurrentProj(),
      'EPSG:3857',
    );
    const bbox = params.filterByExtent ? b.join(',') : '';

    const withPermissionOrMine = params.filterByOnlyMine
      ? loggedIn
        ? `workspaces/${endpoint.user}/`
        : ''
      : '';
    const url = `${endpoint.url}/rest/${withPermissionOrMine}maps`;

    endpoint.listLoading = this.$http
      .get(url, {
        observe: 'response',
        withCredentials: loggedIn,
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
              response.body,
            );
          }
        }),
        catchError((e) => {
          if (isErrorHandlerFunction(endpoint.onError?.compositionLoad)) {
            (<EndpointErrorHandler>endpoint.onError?.compositionLoad).handle(
              endpoint,
              e,
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
                  'COMPOSITIONS.errorWhileRequestingCompositions',
                  undefined,
                ),
                endpoint.title +
                  ': ' +
                  this.hsLanguageService.getTranslationIgnoreNonExisting(
                    'ERRORMESSAGES',
                    e.status ? e.status.toString() : e.message,
                    {url: endpoint.url},
                  ),
                {
                  disableLocalization: true,
                  serviceCalledFrom: 'HsCompositionsLaymanService',
                },
              );
              break;
          }
          return of(e);
        }),
      );
    return endpoint.listLoading;
  }

  /**
   * Middleware function before returning compositions list to the rest of the app
   * @param endpoint - Layman endpoint selected
   * @param response - HTTP request response
   */
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
      const tmp: HsMapCompositionDescriptor = {
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
        date: record.updated_at.split('.')[0],
        id: `m-${record.uuid}`, //m-* to match micka's id structure.
      };
      if (response.body.extentFeatureCreated) {
        const extentFeature = addExtentFeature(
          record,
          this.hsMapService.getCurrentProj(),
        );
        if (extentFeature) {
          tmp.featureId = extentFeature.getId().toString();
          response.body.extentFeatureCreated(extentFeature);
        }
      }
      return tmp;
    });
  }

  /**
   * Delete selected composition from Layman database
   * @param endpoint - Layman endpoint selected
   * @param composition - Composition to be deleted
   */
  async delete(
    endpoint: HsEndpoint,
    composition: HsMapCompositionDescriptor,
  ): Promise<void> {
    const url = `${endpoint.url}/rest/workspaces/${composition.workspace}/maps/${composition.name}`;
    await lastValueFrom(this.$http.delete(url, {withCredentials: true}));
    this.hsEventBusService.compositionDeletes.next(composition);
  }

  /**
   * Get information about the selected composition
   * @param composition - Composition selected
   */
  async getInfo(composition: HsMapCompositionDescriptor): Promise<any> {
    const endpoint = composition.endpoint;
    if (composition.name == undefined) {
      this.displayWarningToast(
        endpoint,
        'COMPOSITIONS.compositionsNameAttributeIsNotDefined',
      );
      return;
    }
    if (endpoint.url == undefined) {
      this.displayWarningToast(
        endpoint,
        'COMPOSITIONS.endpointUrlIsNotDefined',
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

  /**
   * Reset Layman composition paging values
   * @param endpoint - Layman endpoint selected
   */
  resetCompositionCounter(endpoint: HsEndpoint): void {
    endpoint.compositionsPaging.start = 0;
    endpoint.compositionsPaging.next = endpoint.compositionsPaging.limit;
    endpoint.compositionsPaging.matched = 0;
  }

  /**
   * Display warning toast about some error while requesting compositions
   * @param endpoint - Layman endpoint selected
   * @param message - Message to be displayed when warning is issued
   */
  displayWarningToast(endpoint: HsEndpoint, message: string): void {
    this.hsToastService.createToastPopupMessage(
      this.hsLanguageService.getTranslation('COMMON.warning', undefined),
      endpoint.title + ': ' + this.hsLanguageService.getTranslation(message),
      {
        disableLocalization: true,
        toastStyleClasses: 'bg-warning text-light',
        serviceCalledFrom: 'HsCompositionsLaymanService',
      },
    );
  }
}
