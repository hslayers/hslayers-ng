import {HsCompositionsParserService} from '../compositions-parser.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsUtilsService} from '../../utils/utils.service';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsLaymanService {
  data: any = {};
  constructor(
    private $http: HttpClient,
    private HsUtilsService: HsUtilsService,
    private HsCompositionsParserService: HsCompositionsParserService,
    private HsEventBusService: HsEventBusService
  ) {}

  loadList(endpoint, params, bbox, extentLayer) {
    endpoint.getCurrentUserIfNeeded(endpoint);
    endpoint.compositionsPaging.loaded = false;
    if (params.sortBy == undefined) {
      params.sortBy = '';
    }
    return new Promise(async (resolve, reject) => {
      try {
        if (angular.isDefined(this.canceler)) {
          this.canceler.resolve();
          delete this.canceler;
        }
        this.canceler = $q.defer();
        let response = await $http.get(
          `${endpoint.url}/rest/${endpoint.user}/maps`,
          {
            timeout: this.canceler.promise,
          }
        );

        endpoint.compositionsPaging.loaded = true;
        response = response.data;
        endpoint.compositions = response;
        if (response && response.length > 0) {
          endpoint.compositionsPaging.matched = response.length;
        } else {
          endpoint.compositionsPaging.matched = 0;
        }
        for (const record of endpoint.compositions) {
          record.editable = true;
          record.endpoint = endpoint;
        }
        resolve();
      } catch (ex) {
        reject(ex);
      }
    });
  }

  async delete(endpoint, composition) {
    let url = `${endpoint.url}/rest/${endpoint.user}/maps/${composition.name}`;
    const method = 'DELETE';
    url = this.HsUtilsService.proxify(url);
    await $http({url, method});
    this.HsEventBusService.compositionDeletes.next(composition);
  }

  async getInfo(composition) {
    const endpoint = composition.endpoint;
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
