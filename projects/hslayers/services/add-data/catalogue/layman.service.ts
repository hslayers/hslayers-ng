import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {Observable, catchError, lastValueFrom, map, of, timeout} from 'rxjs';
import {transformExtent} from 'ol/proj';

import {
  EndpointErrorHandler,
  EndpointErrorHandling,
  HsEndpoint,
  isErrorHandlerFunction,
} from 'hslayers-ng/types';
import {HsAddDataLayerDescriptor} from 'hslayers-ng/types';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLaymanLayerDescriptor} from 'hslayers-ng/types';
import {HsLogService} from 'hslayers-ng/shared/log';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsToastService} from 'hslayers-ng/common/toast';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {addExtentFeature} from 'hslayers-ng/common/utils';

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
    public hsMapService: HsMapService,
  ) {}

  /**
   * Loads datasets metadata from Layman
   * @param endpoint - Configuration of selected datasource (from app config)
   * extent feature is created. Has one parameter: feature
   * @param data - Query parameters
   */
  queryCatalog(
    endpoint: HsEndpoint,
    data?: {
      onlyMine: boolean;
      limit?: string | number;
      query: any;
      filterByExtent?: boolean;
    },
    extentFeatureCreated?: (feature: Feature<Geometry>) => void,
  ): Observable<any> {
    endpoint.getCurrentUserIfNeeded(endpoint);
    const loggedIn = endpoint.authenticated;
    const withPermissionOrMine = data?.onlyMine
      ? loggedIn
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
        this.hsMapService
          .getMap()
          .getView()
          .calculateExtent(this.hsMapService.getMap().getSize()),
        this.hsMapService.getMap().getView().getProjection(),
        'EPSG:3857',
      );
      bbox = data.filterByExtent ? b.join(',') : '';

      params = {
        //Draw layer limit independent on datasourcePaging
        limit: `${data.limit ?? endpoint.datasourcePaging.limit}`,
        offset: `${endpoint.datasourcePaging.start}`,
        full_text_filter: `${query?.textFilter ?? ''}`,
        order_by: `${sortBy ?? 'last_change'}`,
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
        withCredentials: loggedIn,
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
              x.body,
            );
          }
          return x.body;
        }),
        catchError(async (e) => {
          if (isErrorHandlerFunction(endpoint.onError?.compositionLoad)) {
            (<EndpointErrorHandler>endpoint.onError?.compositionLoad).handle(
              endpoint,
              e,
            );
            return of(e);
          }
          switch (endpoint.onError?.compositionLoad) {
            case EndpointErrorHandling.ignore:
              break;
            case EndpointErrorHandling.toast:
            default:
              this.hsToastService.createToastPopupMessage(
                await this.hsLanguageService.awaitTranslation(
                  'ADDLAYERS.ERROR.errorWhileRequestingLayers',
                  undefined,
                ),
                endpoint.title +
                  ': ' +
                  this.hsLanguageService.getTranslationIgnoreNonExisting(
                    'ERRORMESSAGES',
                    e.status ? e.status.toString() : e.message,
                    {url},
                  ),
                {
                  disableLocalization: true,
                  serviceCalledFrom: 'HsLaymanBrowserService',
                },
              );
          }
          endpoint.datasourcePaging.loaded = true;
          return of(e);
        }),
      );
    return endpoint.httpCall;
  }

  /**
   * (PRIVATE) Callback for catalogue http query
   * @param data - HTTP response containing all the layers
   */
  private datasetsReceived(data): void {
    if (!data.dataset) {
      this.hsToastService.createToastPopupMessage(
        this.hsLanguageService.getTranslation('COMMON.warning', undefined),
        data.dataset.title +
          ': ' +
          this.hsLanguageService.getTranslation(
            'COMMON.noDataReceived',
            undefined,
          ),
        {
          disableLocalization: true,
          toastStyleClasses: 'bg-warning text-light',
          serviceCalledFrom: 'HsLaymanBrowserService',
        },
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
          name: layer.name,
          id: layer.uuid,
          featureId: layer.featureId,
          highlighted: false,
          workspace: layer.workspace,
          access_rights: layer.access_rights,
          editable: layer.access_rights.write.some((user) => {
            return [dataset.user, 'EVERYONE'].includes(user);
          }),
          wfsWmsStatus: layer.wfs_wms_status,
        };
        if (data.extentFeatureCreated) {
          const extentFeature = addExtentFeature(
            layer,
            this.hsMapService.getCurrentProj(),
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
    layer: HsAddDataLayerDescriptor,
  ): Promise<HsAddDataLayerDescriptor> {
    const url = `${endpoint.url}/rest/workspaces/${layer.workspace}/layers/${layer.name}`;
    try {
      const data = await lastValueFrom(
        this.http
          .get<HsLaymanLayerDescriptor>(url, {
            //timeout: endpoint.canceler.promise,
            //endpoint,
            responseType: 'json',
            withCredentials: true,
          })
          .pipe(
            catchError((e) => {
              //Layer not found
              if (e?.error.code == 15) {
                return of(e?.error);
              }
              throw e;
            }),
          ),
      );
      if (data.code || data.message) {
        if (data.code == 32) {
          endpoint.user = undefined;
          endpoint.authenticated = false;
          this.hsCommonLaymanService.authChange.next(endpoint);
        }
        this.hsToastService.createToastPopupMessage(
          data.message ?? 'ADDLAYERS.ERROR.errorWhileRequestingLayers',
          data.detail ?? `${data.code}/${data.sub_code}`,
          {},
        );
        return;
      }

      layer.type =
        data?.file?.file_type === 'raster' ? ['WMS'] : ['WMS', 'WFS'];
      layer = {...layer, ...data};
      if (layer.thumbnail) {
        layer.thumbnail = endpoint.url + layer.thumbnail.url;
      }
      return layer;
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
    layer: HsAddDataLayerDescriptor,
  ): Promise<any> {
    const lyr = await this.fillLayerMetadata(ds, layer);
    if (!lyr) {
      return;
    }
    let style: string = undefined;
    if (lyr.style?.url) {
      style = await this.hsCommonLaymanService.getStyleFromUrl(lyr.style?.url);
    }
    if (lyr.style?.type == 'sld') {
      if (!style?.includes('StyledLayerDescriptor')) {
        style = undefined;
      }
    }
    if (lyr.style?.type == 'qml') {
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
          'ADDLAYERS.ERROR.errorWhileRequestingLayers',
          undefined,
        ),
        this.hsLanguageService.getTranslation(
          'ADDLAYERS.ERROR.urlInvalid',
          undefined,
        ),
        {
          disableLocalization: true,
          serviceCalledFrom: 'HsLaymanBrowserService',
        },
      );
      return false;
    }
  }
}
