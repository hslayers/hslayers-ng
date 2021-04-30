import {
  EndpointErrorHandler,
  EndpointErrorHandling,
  HsEndpoint,
  isErrorHandlerFunction,
} from '../../../common/endpoints/endpoint.interface';
import {HsCompositionsParserService} from '../compositions-parser.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLanguageService} from '../../language/language.service';
import {HsMapService} from '../../map/map.service';
import {HsToastService} from '../../layout/toast/toast.service';
import {HsUtilsService} from '../../utils/utils.service';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError, map, timeout} from 'rxjs/operators';
import {transformExtent} from 'ol/proj';
@Injectable({
  providedIn: 'root',
})
export class HsCompositionsLaymanService {
  data: any = {};
  constructor(
    private $http: HttpClient,
    public hsUtilsService: HsUtilsService,
    public hsCompositionsParserService: HsCompositionsParserService,
    public hsEventBusService: HsEventBusService,
    public hsToastService: HsToastService,
    public hsLanguageService: HsLanguageService,
    public hsMapService: HsMapService
  ) {}

  loadList(endpoint: HsEndpoint, params): Observable<any> {
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
      this.hsMapService.map.getView().getProjection(),
      'EPSG:3857'
    );
    const bbox = params.filterByExtent ? b.join(',') : '';

    endpoint.listLoading = this.$http
      .get(`${endpoint.url}/rest/${endpoint.user}/maps`, {
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
            this.compositionsReceived(endpoint, response);
          } else {
            this.displayLaymanError(endpoint.title, response.body);
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
                true
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
      : 0;

    endpoint.compositions = response.body.map((record) => {
      return {
        name: record.name,
        title: record.title,
        access_rights: record.access_rights,
        editable: true,
        url: `${endpoint.url}/rest/${endpoint.user}/maps/${record.name}`,
        endpoint: endpoint,
        id: record.uuid,
      };
    });

    for (const record of endpoint.compositions) {
      record.editable = true;
      record.url = `${endpoint.url}/rest/${endpoint.user}/maps/${record.name}`;
      record.endpoint = endpoint;
    }
  }
  async delete(endpoint: HsEndpoint, composition): Promise<void> {
    const url = `${endpoint.url}/rest/${endpoint.user}/maps/${composition.name}`;
    await this.$http.delete(url).toPromise();
    this.hsEventBusService.compositionDeletes.next(composition);
  }
  displayLaymanError(endpointTitle: string, responseBody: any): void {
    let simplifiedResponse = '';
    if (responseBody.code === undefined) {
      simplifiedResponse = 'COMMON.unknownError';
    }
    switch (responseBody.code) {
      case 48:
        simplifiedResponse =
          'Please enable Filter by map extent checkbox to by able to sort data by Bounding box';
        break;
      case 32:
        simplifiedResponse =
          'Unsuccessful OAuth2 authentication. Access token is not valid';
        break;
      default:
        simplifiedResponse = responseBody.message + ' ' + responseBody.detail;
    }
    //If response is object, it is an error response
    this.hsToastService.createToastPopupMessage(
      this.hsLanguageService.getTranslation(
        'COMPOSITIONS.errorWhileRequestingCompositions'
      ),
      endpointTitle +
        ': ' +
        this.hsLanguageService.getTranslationIgnoreNonExisting(
          'COMMON',
          simplifiedResponse
        ),
      true
    );
  }
  async getInfo(composition: any): Promise<any> {
    const endpoint = composition.endpoint;
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
    const url = `${endpoint.url}/rest/${endpoint.user}/maps/${composition.name}`;
    const info = await this.hsCompositionsParserService.loadInfo(url);
    if (
      info.thumbnail.status !== undefined &&
      info.thumbnail.status == 'NOT_AVAILABLE'
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
      true,
      'bg-warning text-light'
    );
  }
}
