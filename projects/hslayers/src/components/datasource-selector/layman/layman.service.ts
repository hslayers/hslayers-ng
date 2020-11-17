import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Subscription} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

import {HsDatasourceLayerDescriptor} from '../datasource-layer-descriptor.interface';
import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {HsLogService} from '../../../common/log/log.service';
import {HsUtilsService} from '../../utils/utils.service';

@Injectable({providedIn: 'root'})
export class HsLaymanBrowserService {
  httpCall: Subscription;

  constructor(
    private http: HttpClient,
    private log: HsLogService,
    public hsUtilsService: HsUtilsService
  ) {}

  /**
   * @function queryCatalog
   * @param {HsEndpoint} endpoint Configuration of selected datasource (from app config)
   * extent feature is created. Has one parameter: feature
   * @description Loads datasets metadata from Layman
   */
  queryCatalog(endpoint: HsEndpoint): void {
    endpoint.getCurrentUserIfNeeded(endpoint);
    let url = `${endpoint.url}/rest/${endpoint.user}/layers`;
    url = this.hsUtilsService.proxify(url);
    endpoint.datasourcePaging.loaded = false;
    if (this.httpCall !== undefined) {
      this.httpCall.unsubscribe();
      delete this.httpCall;
    }
    //endpoint.canceler = $q.defer();
    this.httpCall = this.http
      .get(url, {
        //timeout: endpoint.canceler.promise,
        //dataset: endpoint,
        responseType: 'json',
      })
      .pipe(
        map((x: any) => {
          x.dataset = endpoint;
          return x;
        })
      )
      .subscribe(
        (data) => this.datasetsReceived(data),
        (e) => {
          this.log.error(e);
          endpoint.datasourcePaging.loaded = true;
        }
      );
  }

  /**
   * @private
   * @function datasetsReceived
   * @param {object} data HTTP response containing all the layers
   * @description (PRIVATE) Callback for catalogue http query
   */
  private datasetsReceived(data): void {
    if (!data.dataset) {
      this.log.error('Malformed data received');
      return;
    }
    const dataset = data.dataset;
    dataset.loading = false;
    dataset.layers = [];
    dataset.datasourcePaging.loaded = true;
    if (data.data === null) {
      dataset.datasourcePaging.matched == 0;
    } else {
      dataset.datasourcePaging.matched = data.matched;
      for (const lyr in data) {
        if (data[lyr]) {
          const obj = {
            title: data[lyr].name,
            type: ['WMS', 'WFS'],
            name: data[lyr].name,
          };
          dataset.layers.push(obj);
        }
      }
    }
  }

  /**
   * @function fillLayerMetadata
   * @param {HsEndpoint} dataset Configuration of selected datasource (from app config)
   * @param {object} layer Layman layer for which to get metadata
   * @returns {Promise} Promise which is resolved when layer metadata is filled
   * @description Fills metadata about layer, because layman layer list API provides
   * just name and uuid
   */
  async fillLayerMetadata(
    dataset: HsEndpoint,
    layer: HsDatasourceLayerDescriptor
  ): Promise<HsDatasourceLayerDescriptor> {
    let url = `${dataset.url}/rest/${dataset.user}/layers/${layer.name}`;
    url = this.hsUtilsService.proxify(url);
    try {
      return await this.http
        .get(url, {
          //timeout: dataset.canceler.promise,
          //dataset,
          responseType: 'json',
        })
        .toPromise()
        .then((data: any) => {
          layer = {...layer, ...data};
          if (layer.thumbnail) {
            layer.thumbnail = dataset.url + layer.thumbnail.url;
          }
          return layer;
        });
    } catch (e) {
      this.log.error(e);
      return e;
    }
  }

  /**
   * @function describeWhatToAdd
   * @param {HsEndpoint} ds Configuration of selected datasource (from app config)
   * @param {object} layer Layman layer for which to get metadata
   * @returns {Promise} Promise which describes layer
   * in a common format for use in add-layers component
   * @description Gets layer metadata and returns promise which describes layer
   */
  async describeWhatToAdd(
    ds: HsEndpoint,
    layer: HsDatasourceLayerDescriptor
  ): Promise<any> {
    const lyr = await this.fillLayerMetadata(ds, layer);
    return {
      type: lyr.type,
      link: lyr.wms.url,
      layer: lyr.name,
      title: lyr.name,
      dsType: ds.type,
    };
  }
}
