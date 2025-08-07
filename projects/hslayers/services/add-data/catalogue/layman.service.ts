import {HttpClient} from '@angular/common/http';
import {Injectable, inject} from '@angular/core';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {Observable, catchError, map, of, timeout} from 'rxjs';
import {transformExtent} from 'ol/proj';

import {
  EndpointErrorHandler,
  EndpointErrorHandling,
  HsEndpoint,
  isErrorHandlerFunction,
  HsAddDataLaymanLayerDescriptor,
  HsLaymanGetLayer,
} from 'hslayers-ng/types';
import {
  HsCommonLaymanLayerService,
  HsCommonLaymanService,
} from 'hslayers-ng/common/layman';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsToastService} from 'hslayers-ng/common/toast';
import {addExtentFeature} from 'hslayers-ng/services/utils';

/**
 * Layman GET /layers response wrapper with custom HSLayers properties
 */
export interface HsLaymanGetLayersWrapper {
  endpoint?: HsEndpoint;
  extentFeatureCreated?: (feature: Feature<Geometry>) => void;
  matched?: number;
  datasets?: HsLaymanGetLayer[];
}

@Injectable({providedIn: 'root'})
export class HsLaymanBrowserService {
  private http = inject(HttpClient);
  private log = inject(HsLogService);
  hsCommonLaymanService = inject(HsCommonLaymanService);
  private hsCommonLaymanLayerService = inject(HsCommonLaymanLayerService);
  hsToastService = inject(HsToastService);
  hsLanguageService = inject(HsLanguageService);
  hsMapService = inject(HsMapService);

  httpCall;

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
    const loggedIn = this.hsCommonLaymanService.isAuthenticated();
    const workspace = this.hsCommonLaymanService.user();
    const withPermissionOrMine = data?.onlyMine
      ? loggedIn
        ? `workspaces/${workspace}/`
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
      .get<HsLaymanGetLayer[]>(url, {
        observe: 'response',
        withCredentials: loggedIn,
        responseType: 'json',
        params,
      })
      .pipe(
        timeout(5000),
        map((x) => {
          const data: HsLaymanGetLayersWrapper = {};
          if (Array.isArray(x.body)) {
            data.datasets = x.body;
            data.endpoint = endpoint;
            data.extentFeatureCreated = extentFeatureCreated;
            data.matched = x.headers.get('x-total-count')
              ? parseInt(x.headers.get('x-total-count'))
              : x.body.length;
            this.datasetsReceived(data);
          } else {
            this.hsCommonLaymanService.displayLaymanError(
              endpoint,
              'ADDLAYERS.ERROR.errorWhileRequestingLayers',
              x.body as any,
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
  private datasetsReceived(data: HsLaymanGetLayersWrapper): void {
    const endpoint = data.endpoint;
    if (!endpoint) {
      this.hsToastService.createToastPopupMessage(
        this.hsLanguageService.getTranslation('COMMON.warning', undefined),
        endpoint.title +
          ': ' +
          this.hsLanguageService.getTranslation(
            'COMMON.noDataReceived',
            undefined,
          ),
        {
          disableLocalization: true,
          type: 'warning',
          serviceCalledFrom: 'HsLaymanBrowserService',
        },
      );
      return;
    }
    endpoint.loading = false;
    endpoint.layers = [];
    endpoint.datasourcePaging.loaded = true;
    if (!data.datasets.length) {
      endpoint.datasourcePaging.matched = 0;
    } else {
      endpoint.datasourcePaging.matched = data.matched;
      endpoint.layers = data.datasets.map((layer) => {
        const tmp: HsAddDataLaymanLayerDescriptor = {
          title: layer.title,
          name: layer.name,
          id: layer.uuid,
          highlighted: false,
          workspace: layer.workspace,
          access_rights: layer.access_rights,
          editable: layer.access_rights.write.some((user) => {
            return [this.hsCommonLaymanService.user(), 'EVERYONE'].includes(
              user,
            );
          }),
          wfsWmsStatus: layer.wfs_wms_status,
        };
        if (data.extentFeatureCreated) {
          const extentFeature = addExtentFeature(
            layer,
            this.hsMapService.getCurrentProj(),
          );
          if (extentFeature) {
            tmp.featureId = extentFeature.getId() as string;
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
    layer: HsAddDataLaymanLayerDescriptor,
  ): Promise<HsAddDataLaymanLayerDescriptor> {
    try {
      const data = await this.hsCommonLaymanLayerService.describeLayer(
        layer.name,
        layer.workspace,
        {
          useCache: true,
        },
      );
      layer.type = data?.geodata_type === 'vector' ? ['WMS', 'WFS'] : ['WMS'];
      layer = {...layer, ...data};
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
    layer: HsAddDataLaymanLayerDescriptor,
  ) {
    const lyr = await this.fillLayerMetadata(ds, layer);
    if (!lyr) {
      return undefined;
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
      const {type, wms, name, title, editable, workspace, bounding_box} = lyr;
      return {
        ...lyr,
        link: wms.url,
        layer: wms.name,
        dsType: ds.type,
        extent: bounding_box,
        style,
        name,
        title,
        editable,
        workspace,
        type,
      };
    }
    this.hsToastService.createToastPopupMessage(
      'ADDLAYERS.ERROR.errorWhileRequestingLayers',
      'ADDLAYERS.ERROR.urlInvalid',
      {
        serviceCalledFrom: 'HsLaymanBrowserService',
      },
    );
    return undefined;
  }
}
