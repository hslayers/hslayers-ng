import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Observable, of} from 'rxjs';
import {catchError, map, timeout} from 'rxjs/operators';
import {transformExtent} from 'ol/proj';

import {
  EndpointErrorHandler,
  EndpointErrorHandling,
  HsEndpoint,
  isErrorHandlerFunction,
} from '../../../../common/endpoints/endpoint.interface';
import {HsAddDataLayerDescriptor} from '../layer-descriptor.model';
import {HsCommonLaymanService} from '../../../../common/layman/layman.service';
import {HsLanguageService} from '../../../language/language.service';
import {HsLogService} from '../../../../common/log/log.service';
import {HsMapService} from '../../../map/map.service';
import {HsToastService} from '../../../layout/toast/toast.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {addExtentFeature} from '../../../../common/extent-utils';

@Injectable({providedIn: 'root'})
export class HsLaymanBrowserService {
  httpCall;

  constructor(
    private http: HttpClient,
    private log: HsLogService,
    public hsCommonLaymanService: HsCommonLaymanService,
    public hsUtilsService: HsUtilsService,
    public hsToastService: HsToastService,
    public hsLanguageService: HsLanguageService,
    public hsMapService: HsMapService
  ) {}

  /**
   * Loads datasets metadata from Layman
   * @param endpoint - Configuration of selected datasource (from app config)
   * extent feature is created. Has one parameter: feature
   * @param data -
   */
  queryCatalog(
    endpoint: HsEndpoint,
    data?: any,
    extentFeatureCreated?
  ): Observable<any> {
    endpoint.getCurrentUserIfNeeded(endpoint);
    const withPermissionOrMine = data?.onlyMine
      ? endpoint.user !== 'anonymous' && endpoint.user !== 'browser'
        ? `workspaces/${endpoint.user}/`
        : ''
      : '';
    const url = `${endpoint.url}/rest/${withPermissionOrMine}layers`;
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
        //Draw layer limit independent on datasourcePaging
        'limit': `${data.limit ?? endpoint.datasourcePaging.limit}`,
        'offset': `${endpoint.datasourcePaging.start}`,
        'full_text_filter': `${query?.textFilter ?? ''}`,
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
        params,
      })
      .pipe(
        timeout(5000),
        map((x: any) => {
          if (Array.isArray(x.body)) {
            x.body.dataset = endpoint;
            x.body.extentFeatureCreated = extentFeatureCreated;
            x.body.matched = x.headers.get('x-total-count')
              ? x.headers.get('x-total-count')
              : x.body.length;
            this.datasetsReceived(x.body);
          } else {
            this.hsCommonLaymanService.displayLaymanError(
              endpoint,
              'ADDLAYERS.ERROR.errorWhileRequestingLayers',
              x.body
            );
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
                  'ADDLAYERS.ERROR.errorWhileRequestingLayers'
                ),
                endpoint.title +
                  ': ' +
                  this.hsLanguageService.getTranslationIgnoreNonExisting(
                    'ERRORMESSAGES',
                    e.status ? e.status.toString() : e.message,
                    {url: url}
                  ),
                {
                  disableLocalization: true,
                  serviceCalledFrom: 'HsLaymanBrowserService',
                }
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
        'ADDLAYERS.ERROR.errorWhileRequestingLayers'
      ),
      endpointTitle +
        ': ' +
        this.hsLanguageService.getTranslationIgnoreNonExisting(
          'COMMON',
          simplifiedResponse
        ),
      {disableLocalization: true, serviceCalledFrom: 'HsLaymanBrowserService'}
    );
  }

  /**
   * (PRIVATE) Callback for catalogue http query
   * @param data - HTTP response containing all the layers
   */
  private datasetsReceived(data): void {
    if (!data.dataset) {
      this.hsToastService.createToastPopupMessage(
        this.hsLanguageService.getTranslation('COMMON.warning'),
        data.dataset.title +
          ': ' +
          this.hsLanguageService.getTranslation('COMMON.noDataReceived'),
        {
          disableLocalization: true,
          toastStyleClasses: 'bg-warning text-light',
          serviceCalledFrom: 'HsLaymanBrowserService',
        }
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
        const tmp = {
          title: layer.title,
          type: ['WMS', 'WFS'],
          name: layer.name,
          id: layer.uuid,
          featureId: layer.featureId,
          highlighted: false,
          workspace: layer.workspace,
          editable: layer.access_rights.write.some((user) => {
            return [dataset.user, 'EVERYONE'].includes(user);
          }),
        };
        if (data.extentFeatureCreated) {
          const extentFeature = addExtentFeature(
            layer,
            this.hsMapService.getCurrentProj()
          );
          if (extentFeature) {
            tmp.featureId = extentFeature.getId();
            data.extentFeatureCreated(extentFeature);
          }
        }
        return tmp;
      });
    }
  }

  /**
   * Fills metadata about layer, because Layman layer list API provides just name and UUID
   * @param endpoint - Configuration of selected datasource (from app config)
   * @param layer - Layman layer for which to get metadata
   * @returns Promise which is resolved when layer metadata is filled
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
   * Gets layer metadata and returns promise which describes layer
   * @param ds - Configuration of selected datasource (from app config)
   * @param layer - Layman layer for which to get metadata
   * @returns Promise which describes layer in a common format for use in add-layers component
   */
  async describeWhatToAdd(
    ds: HsEndpoint,
    layer: HsAddDataLayerDescriptor
  ): Promise<any> {
    const lyr = await this.fillLayerMetadata(ds, layer);
    let style: string = undefined;
    if (lyr.style?.url) {
      style = await this.getStyleFromUrl(lyr.style?.url);
    }
    if (lyr.style.type == 'sld') {
      if (!style?.includes('StyledLayerDescriptor')) {
        style = undefined;
      }
    }
    if (lyr.style.type == 'qml') {
      if (!style?.includes('<qgis')) {
        style = undefined;
      }
    }
    if (lyr.wms.url) {
      return {
        type: lyr.type,
        link: lyr.wms.url,
        style,
        layer: lyr.name,
        name: lyr.name,
        title: lyr.title,
        dsType: ds.type,
        editable: lyr.editable,
        workspace: lyr.workspace,
      };
    } else {
      this.hsToastService.createToastPopupMessage(
        this.hsLanguageService.getTranslation(
          'ADDLAYERS.ERROR.errorWhileRequestingLayers'
        ),
        this.hsLanguageService.getTranslation('ADDLAYERS.ERROR.urlInvalid'),
        {disableLocalization: true, serviceCalledFrom: 'HsLaymanBrowserService'}
      );
      return false;
    }
  }

  async getStyleFromUrl(styleUrl: string): Promise<string> {
    try {
      const req = this.http.get(styleUrl, {
        headers: new HttpHeaders().set('Content-Type', 'text'),
        responseType: 'text',
        withCredentials: true,
      });
      return await req.toPromise();
    } catch (ex) {
      console.error(ex);
    }
  }
}
