import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {catchError} from 'rxjs/operators';

import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {HsUtilsService} from '../../utils/utils.service';

@Injectable({providedIn: 'root'})
export class HsLaymanBrowserService {
  constructor(
    private http: HttpClient,
    private hsUtilsService: HsUtilsService
  ) {
    'ngInject';
  }

  /**
   * @function queryCatalog
   * @memberof HsLaymanBrowserService
   * @param {object} endpoint Configuration of selected datasource (from app config)
   * extent feature is created. Has one parameter: feature
   * @description Loads datasets metadata from Layman
   */
  queryCatalog(endpoint: HsEndpoint): void {
    endpoint.getCurrentUserIfNeeded(endpoint);
    let url = `${endpoint.url}/rest/${endpoint.user}/layers`;
    url = this.hsUtilsService.proxify(url);
    endpoint.datasourcePaging.loaded = false;
    /*if (endpoint.canceler !== undefined) {
      endpoint.canceler.resolve();
      delete endpoint.canceler;
    }*/
    //endpoint.canceler = $q.defer();
    this.http
      .get(url, {
        //timeout: endpoint.canceler.promise,
        //dataset: endpoint,
        responseType: 'json',
      })
      .subscribe(this.datasetsReceived, (e) => {
        endpoint.datasourcePaging.loaded = true;
      });
  }

  /**
   * @private
   * @function datasetsReceived
   * @memberof HsLaymanBrowserService
   * @param {object} j HTTP response containing all the layers
   * (PRIVATE) Callback for catalogue http query
   */
  datasetsReceived(j): void {
    const dataset = j.config.dataset;
    dataset.loading = false;
    dataset.layers = [];
    dataset.datasourcePaging.loaded = true;
    if (j.data === null) {
      dataset.datasourcePaging.matched == 0;
    } else {
      j = j.data;
      dataset.datasourcePaging.matched = j.length;
      for (const lyr in j) {
        if (j[lyr]) {
          const obj = {
            title: j[lyr].name,
            type: ['WMS', 'WFS'],
            name: j[lyr].name,
          };
          dataset.layers.push(obj);
        }
      }
    }
  }

  /**
   * @function fillLayerMetadata
   * @memberof HsLaymanBrowserService
   * @param {object} dataset Configuration of selected datasource (from app config)
   * @param {object} layer Layman layer for which to get metadata
   * @returns {Promise} Promise which is resolved when layer metadata is filled
   * Fills metadata about layer, because layman layer list API provides
   * just name and uuid
   */
  fillLayerMetadata(dataset, layer): Promise<any> {
    let url = `${dataset.url}/rest/${dataset.user}/layers/${layer.name}`;
    url = this.hsUtilsService.proxify(url);
    return new Promise((resolve, reject) => {
      this.http
        .get(url, {
          //timeout: dataset.canceler.promise,
          //dataset,
          responseType: 'json',
        })
        .toPromise()
        .then((j: any) => {
          layer = {...layer, ...j.data};
          if (layer.thumbnail) {
            layer.thumbnail = dataset.url + layer.thumbnail.url;
          }
          resolve();
        })
        .catch((e) => reject(e));
    });
  }

  /**
   * @function describeWhatToAdd
   * @memberof HsLaymanBrowserService
   * @param {object} ds Configuration of selected datasource (from app config)
   * @param {object} layer Layman layer for which to get metadata
   * Gets layer metadata and returns promise which describes layer
   * in a common format for use in add-layers component
   */
  describeWhatToAdd(ds, layer): Promise<any> {
    return new Promise((resolve, reject) => {
      this.fillLayerMetadata(ds, layer).then(() => {
        resolve({
          type: layer.type,
          link: layer.wms.url,
          layer: layer.name,
          title: layer.name,
        });
      });
    });
  }
}
