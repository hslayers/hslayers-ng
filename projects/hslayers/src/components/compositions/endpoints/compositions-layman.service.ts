import {HsCompositionsParserService} from '../compositions-parser.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsUtilsService} from '../../utils/utils.service';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Subscription} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsLaymanService {
  data: any = {};
  constructor(
    private $http: HttpClient,
    public HsUtilsService: HsUtilsService,
    public HsCompositionsParserService: HsCompositionsParserService,
    public HsEventBusService: HsEventBusService
  ) {}

  loadList(endpoint, params, bbox, extentLayer): Promise<any> {
    return new Promise((resolve, reject) => {
      endpoint.getCurrentUserIfNeeded(endpoint);
      endpoint.compositionsPaging.loaded = false;
      try {
        if (endpoint.listLoading) {
          endpoint.listLoading.unsubscribe();
          delete endpoint.listLoading;
        }
        endpoint.listLoading = this.$http
          .get(`${endpoint.url}/rest/${endpoint.user}/maps`)
          .subscribe((response: any) => {
            endpoint.compositionsPaging.loaded = true;
            if (params.query.title !== '' && params.query.title !== undefined ) {
              endpoint.compositions = response.filter((comp) => comp.title.includes(params.query.title));
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
            resolve();
          });
      } catch (ex) {
        reject(ex);
      }
    });
  }

  async delete(endpoint, composition) {
    let url = `${endpoint.url}/rest/${endpoint.user}/maps/${composition.name}`;
    url = this.HsUtilsService.proxify(url);
    await this.$http.delete(url).toPromise();
    this.HsEventBusService.compositionDeletes.next(composition);
  }

  async getInfo(composition) {
    const endpoint = composition.endpoint;
    if (composition.name == undefined) {
      console.error('Compositions name attribute is not defined!');
      return;
    }
    if (endpoint.user == undefined) {
      console.error('Endpoint user is not defined!');
      return;
    }
    if (endpoint.url == undefined) {
      console.error('Endpoint url is not defined!');
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
  }

  resetCompositionCounter(endpoint) {
    endpoint.compositionsPaging.start = 0;
    endpoint.compositionsPaging.next = this.data.limit;
  }
}
