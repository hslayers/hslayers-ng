import {HsCompositionsParserService} from '../compositions-parser.service';
import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLogService} from '../../../common/log/log.service';
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
    public HsLogService: HsLogService
  ) {}

  loadList(endpoint: HsEndpoint, params): Observable<any> {
    endpoint.getCurrentUserIfNeeded(endpoint);
    endpoint.compositionsPaging.loaded = false;
    endpoint.listLoading = this.$http
      .get(`${endpoint.url}/rest/${endpoint.user}/maps`)
      .pipe(
        timeout(1000),
        map((response: any) => {
          const ep = this.compositionsReceived(endpoint, params, response);
          return ep;
        }),
        catchError((e) => {
          endpoint.datasourcePaging.loaded = true;
          return of(e);
        })
      );

    return endpoint.listLoading;
  }
  compositionsReceived(endpoint: HsEndpoint, params, response): HsEndpoint {
    if (!response) {
      this.HsLogService.error('No data received');
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
    if (response && response.length > 0) {
      endpoint.compositionsPaging.matched = response.length;
    } else {
      endpoint.compositionsPaging.matched = 0;
    }

    for (const record of endpoint.compositions) {
      record.editable = true;
      record.url = `${endpoint.url}/rest/${endpoint.user}/maps/${record.name}`;
      record.endpoint = endpoint;
    }
    return endpoint;
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
      this.HsLogService.warn('Compositions name attribute is not defined!');
      return;
    }
    if (endpoint.user == undefined) {
      this.HsLogService.warn('Endpoint user is not defined!');
      return;
    }
    if (endpoint.url == undefined) {
      this.HsLogService.warn('Endpoint url is not defined!');
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
  }
}
