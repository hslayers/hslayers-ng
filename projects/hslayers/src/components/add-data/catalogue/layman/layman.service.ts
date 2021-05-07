import {
  EndpointErrorHandler,
  EndpointErrorHandling,
  HsEndpoint,
  isErrorHandlerFunction,
} from '../../../../common/endpoints/endpoint.interface';
import {HsAddDataLayerDescriptor} from '../add-data-layer-descriptor.interface';
import {HsLanguageService} from '../../../language/language.service';
import {HsLogService} from '../../../../common/log/log.service';
import {HsMapService} from '../../../map/map.service';
import {HsToastService} from '../../../layout/toast/toast.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError, map, timeout} from 'rxjs/operators';

import {transform, transformExtent} from 'ol/proj';

@Injectable({providedIn: 'root'})
export class HsLaymanBrowserService {
  httpCall;

  constructor(
    private http: HttpClient,
    private log: HsLogService,
    public hsUtilsService: HsUtilsService,
    public hsToastService: HsToastService,
    public hsLanguageService: HsLanguageService,
    public hsMapService: HsMapService
  ) {}

  /**
   * @function queryCatalog
   * @param {HsEndpoint} endpoint Configuration of selected datasource (from app config)
   * extent feature is created. Has one parameter: feature
   * @description Loads datasets metadata from Layman
   */
  queryCatalog(endpoint: HsEndpoint, data?: any): Observable<any> {
    endpoint.getCurrentUserIfNeeded(endpoint);
    const withPermisionOrMine = data?.onlyMine
      ? `workspaces/${endpoint.user}/`
      : '';
    const url = `${endpoint.url}/rest/${withPermisionOrMine}layers`;
    endpoint.datasourcePaging.loaded = false;

    let query, bbox, sortBy, params;

    if (data) {
      query = data.query;
      sortBy = query.sortby == 'date' ? 'last_change' : query.sortby;

      const b = transformExtent(
        this.hsMapService.map
          .getView()
          .calculateExtent(this.hsMapService.map.getSize()),
        this.hsMapService.map.getView().getProjection(),
        'EPSG:3857'
      );
      bbox = data.filterByExtent ? b.join(',') : '';

      params = {
        'limit': `${endpoint.datasourcePaging.limit}`,
        'offset': `${endpoint.datasourcePaging.start}`,
        'full_text_filter': `${query?.textFilter}`,
        'order_by': `${sortBy ?? 'last_change'}`,
      };
      //Use bbox_filter only if its defined to prevent
      //Wrong parameter value error
      if (bbox) {
        params['bbox_filter'] = bbox;
      }
    }

    endpoint.httpCall = this.http
      .get(url, {
        observe: 'response',
        withCredentials: true,
        responseType: 'json',
        params: params,
      })
      .pipe(
        timeout(5000),
        map((x: any) => {
          if (Array.isArray(x.body)) {
            x.body.dataset = endpoint;
            x.body.matched = x.headers.get('x-total-count')
              ? x.headers.get('x-total-count')
              : 0;
            this.datasetsReceived(x.body);
          } else {
            this.displayLaymanError(endpoint.title, x.body);
          }

          return x.body;
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
                  'ADDLAYERS.errorWhileRequestingLayers'
                ),
                endpoint.title +
                  ': ' +
                  this.hsLanguageService.getTranslationIgnoreNonExisting(
                    'ERRORMESSAGES',
                    e.status ? e.status.toString() : e.message,
                    {url: url}
                  ),
                true
              );
          }
          endpoint.datasourcePaging.loaded = true;
          return of(e);
        })
      );
    return endpoint.httpCall;
  }

  displayLaymanError(endpointTitle: string, responseBody: any): void {
    let simplifiedResponse = '';
    if (responseBody.code === undefined) {
      simplifiedResponse = 'COMMON.unknownError';
    }
    switch (responseBody.code) {
      case 48:
        simplifiedResponse = 'mapExtentFilterMissing';
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
        'ADDLAYERS.errorWhileRequestingLayers'
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

  /**
   * @private
   * @function datasetsReceived
   * @param {object} data HTTP response containing all the layers
   * @description (PRIVATE) Callback for catalogue http query
   */
  private datasetsReceived(data): void {
    if (!data.dataset) {
      this.hsToastService.createToastPopupMessage(
        this.hsLanguageService.getTranslation('COMMON.warning'),
        data.dataset.title +
          ': ' +
          this.hsLanguageService.getTranslation('COMMON.noDataReceived'),
        true,
        'bg-warning text-light'
      );
      return;
    }
    const dataset = data.dataset;
    dataset.loading = false;
    dataset.layers = [];
    dataset.datasourcePaging.loaded = true;
    if (!data.length) {
      dataset.datasourcePaging.matched = 0;
    } else {
      dataset.datasourcePaging.matched = parseInt(data.matched);
      dataset.layers = data.map((layer) => {
        return {
          title: layer.title,
          type: ['WMS', 'WFS'],
          name: layer.name,
          id: layer.uuid,
          workspace: layer.workspace,
          editable: layer.access_rights.write.some((user) => {
            return [dataset.user, 'EVERYONE'].includes(user);
          }),
        };
      });
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
    endpoint: HsEndpoint,
    layer: HsAddDataLayerDescriptor
  ): Promise<HsAddDataLayerDescriptor> {
    const url = `${endpoint.url}/rest/workspaces/${layer.workspace}/layers/${layer.name}`;
    try {
      return await this.http
        .get(url, {
          //timeout: endpoint.canceler.promise,
          //endpoint,
          responseType: 'json',
          withCredentials: true,
        })
        .toPromise()
        .then((data: any) => {
          delete data.type;
          layer = {...layer, ...data};
          if (layer.thumbnail) {
            layer.thumbnail = endpoint.url + layer.thumbnail.url;
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
    console.log(lyr);
    return {
      type: lyr.type,
      link: lyr.wms.url,
      layer: lyr.name,
      name: lyr.name,
      title: lyr.title,
      dsType: ds.type,
      editable: lyr.editable,
      workspace: lyr.workspace,
    };
  }
}
