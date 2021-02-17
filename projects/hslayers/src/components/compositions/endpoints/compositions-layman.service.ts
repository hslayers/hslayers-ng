import {HsCompositionsParserService} from '../compositions-parser.service';
import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLanguageService} from '../../language/language.service';
import {HsToastService} from '../../layout/toast/toast.service';
import {HsUtilsService} from '../../utils/utils.service';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError, map, timeout} from 'rxjs/operators';
@Injectable({
  providedIn: 'root',
})
export class HsCompositionsLaymanService {
  data: any = {};
  constructor(
    private $http: HttpClient,
    public HsUtilsService: HsUtilsService,
    public HsCompositionsParserService: HsCompositionsParserService,
    public HsEventBusService: HsEventBusService,
    public HsToastService: HsToastService,
    public HsLanguageService: HsLanguageService
  ) {}

  loadList(endpoint: HsEndpoint, params): Observable<any> {
    endpoint.getCurrentUserIfNeeded(endpoint);
    endpoint.compositionsPaging.loaded = false;
    endpoint.listLoading = this.$http
      .get(`${endpoint.url}/rest/${endpoint.user}/maps`)
      .pipe(
        timeout(5000),
        map((response: any) => {
          this.compositionsReceived(endpoint, params, response);
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
                e.status.toString() || e.message,
                {url: endpoint.url}
              ),
            true
          );
          return of(e);
        })
      );
    return endpoint.listLoading;
  }
  compositionsReceived(endpoint: HsEndpoint, params, response): void {
    if (!response && response.length == 0) {
      endpoint.compositionsPaging.matched = 0;
      this.displayWarningToast(endpoint, 'COMMON.noDataReceived');
      return;
    }
    endpoint.compositionsPaging.loaded = true;
    response = response.map((record) => {
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
    if (params.query.title !== '' && params.query.title !== undefined) {
      endpoint.compositions = response.filter((comp) =>
        comp.title.includes(params.query.title)
      );
    } else {
      endpoint.compositions = response;
    }
    endpoint.compositionsPaging.matched = endpoint.compositions.length;

    for (const record of endpoint.compositions) {
      record.editable = true;
      record.url = `${endpoint.url}/rest/${endpoint.user}/maps/${record.name}`;
      record.endpoint = endpoint;
    }
  }
  async delete(endpoint: HsEndpoint, composition): Promise<void> {
    let url = `${endpoint.url}/rest/${endpoint.user}/maps/${composition.name}`;
    url = this.HsUtilsService.proxify(url);
    await this.$http.delete(url).toPromise();
    this.HsEventBusService.compositionDeletes.next(composition);
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
    const info = await this.HsCompositionsParserService.loadInfo(url);
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
    this.HsToastService.createToastPopupMessage(
      this.HsLanguageService.getTranslation('COMMON.warning'),
      endpoint.title + ': ' + this.HsLanguageService.getTranslation(message),
      true,
      'bg-warning text-light'
    );
  }
}
