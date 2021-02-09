import {HsAddDataLayerDescriptor} from '../add-data-layer-descriptor.interface';
import {HsEndpoint} from '../../../../common/endpoints/endpoint.interface';
import {HsLogService} from '../../../../common/log/log.service';
import {HsToastService} from '../../../layout/toast/toast.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError, map, timeout} from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class HsLaymanBrowserService {
  httpCall;

  constructor(
    private http: HttpClient,
    private log: HsLogService,
    public hsUtilsService: HsUtilsService,
    public HsToastService: HsToastService
  ) {}

  /**
   * @function queryCatalog
   * @param {HsEndpoint} endpoint Configuration of selected datasource (from app config)
   * extent feature is created. Has one parameter: feature
   * @description Loads datasets metadata from Layman
   */
  queryCatalog(endpoint: HsEndpoint, textFilter?: string): Observable<any> {
    endpoint.getCurrentUserIfNeeded(endpoint);
    let url = `${endpoint.url}/rest/${endpoint.user}/layers`;
    url = this.hsUtilsService.proxify(url);
    endpoint.datasourcePaging.loaded = false;

    endpoint.httpCall = this.http
      .get(url, {
        responseType: 'json',
      })
      .pipe(
        timeout(5000),
        map((x: any) => {
          x.dataset = endpoint;
          this.datasetsReceived(x, textFilter);
          return x;
        }),
        catchError((e) => {
          this.HsToastService.createToastPopupMessage(
            'ADDLAYERS.errorWhileRequestingLayers',
            endpoint.title + ': ' + e.message,
            'danger'
          );
          endpoint.datasourcePaging.loaded = true;
          return of(e);
        })
      );
    return endpoint.httpCall;
  }

  /**
   * @private
   * @function datasetsReceived
   * @param {object} data HTTP response containing all the layers
   * @description (PRIVATE) Callback for catalogue http query
   */
  private datasetsReceived(data, textFilter?: string): void {
    if (!data.dataset) {
      this.HsToastService.createToastPopupMessage(
        'COMMON.warning',
        data.dataset.title + ': ' + 'COMMON.noDataReceived',
        'warning'
      );
      return;
    }
    const dataset = data.dataset;
    dataset.loading = false;
    dataset.layers = [];
    dataset.datasourcePaging.loaded = true;
    if (data.data === null) {
      dataset.datasourcePaging.matched = 0;
    } else {
      dataset.datasourcePaging.matched = data.length;
      dataset.layers = data.map((layer) => {
        return {
          title: layer.title,
          type: ['WMS', 'WFS'],
          name: layer.name,
          id: layer.uuid,
        };
      });
      if (textFilter) {
        dataset.layers = dataset.layers.filter((layer) => {
          return layer.title.includes(textFilter);
        });
        dataset.datasourcePaging.matched = dataset.layers.length;
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
    layer: HsAddDataLayerDescriptor
  ): Promise<HsAddDataLayerDescriptor> {
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
          delete data.type;
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
    layer: HsAddDataLayerDescriptor
  ): Promise<any> {
    const lyr = await this.fillLayerMetadata(ds, layer);
    return {
      type: lyr.type,
      link: lyr.wms.url.replace('geoserver', 'client/geoserver'),
      layer: lyr.name,
      name: lyr.name,
      title: lyr.title,
      dsType: ds.type,
    };
  }
}
