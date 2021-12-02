import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {catchError, map, timeout} from 'rxjs/operators';
import {of} from 'rxjs';
import {transformExtent} from 'ol/proj';

import {
  EndpointErrorHandler,
  EndpointErrorHandling,
  HsEndpoint,
  isErrorHandlerFunction,
} from '../../../../common/endpoints/endpoint.interface';
import {HsAddDataLayerDescriptor} from '../layer-descriptor.model';
import {HsLanguageService} from '../../../language/language.service';
import {HsLogService} from '../../../../common/log/log.service';
import {HsMapService} from '../../../map/map.service';
import {HsToastService} from '../../../layout/toast/toast.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {addExtentFeature} from '../../../../common/extent-utils';

@Injectable({providedIn: 'root'})
export class HsMickaBrowserService {
  httpCall;

  constructor(
    private http: HttpClient,
    private log: HsLogService,
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public hsToastService: HsToastService,
    public hsLanguageService: HsLanguageService
  ) {}

  /**
   * @param dataset - Configuration of selected datasource (from app config)
   * @param data - Query properties
   * @param extentFeatureCreated - Function which gets called
   * @param textField - Name of the field to search in
   * extent feature is created. Has one parameter: feature
   * Loads datasets metadata from selected source (CSW server).
   * Currently supports only "Micka" type of source.
   * Use all query params (search text, bbox, params.., sorting, start)
   * @returns
   */
  queryCatalog(
    dataset: HsEndpoint,
    data,
    extentFeatureCreated,
    textField: string
  ): any {
    const url = this.createRequestUrl(dataset, data, textField);
    dataset.datasourcePaging.loaded = false;

    dataset.httpCall = this.http
      .get(url, {
        responseType: 'json',
      })
      .pipe(
        timeout(5000),
        map((x: any) => {
          x.dataset = dataset;
          x.extentFeatureCreated = extentFeatureCreated;
          this.datasetsReceived(x);
          return x;
        }),
        catchError((e) => {
          if (isErrorHandlerFunction(dataset.onError?.compositionLoad)) {
            (<EndpointErrorHandler>dataset.onError?.compositionLoad).handle(
              dataset,
              e
            );
            return of(e);
          }
          switch (dataset.onError?.compositionLoad) {
            case EndpointErrorHandling.ignore:
              break;
            case EndpointErrorHandling.toast:
            default:
              this.hsToastService.createToastPopupMessage(
                this.hsLanguageService.getTranslation(
                  'ADDLAYERS.ERROR.errorWhileRequestingLayers'
                ),
                dataset.title +
                  ': ' +
                  this.hsLanguageService.getTranslationIgnoreNonExisting(
                    'ERRORMESSAGES',
                    e.status ? e.status.toString() : e.message,
                    {url: url}
                  ),
                {
                  disableLocalization: true,
                  serviceCalledFrom: 'HsMickaBrowserService',
                }
              );
          }
          dataset.datasourcePaging.loaded = true;
          return of(e);
        })
      );
    // .subscribe(()=>{console.log('sub')});
    return dataset.httpCall;
  }

  private createRequestUrl(dataset, data, textField) {
    const query = data.query;
    const b = transformExtent(
      this.hsMapService.map
        .getView()
        .calculateExtent(this.hsMapService.map.getSize()),
      this.hsMapService.map.getView().getProjection(),
      'EPSG:4326'
    );
    const bbox = data.filterByExtent ? "BBOX='" + b.join(' ') + "'" : '';
    const sortBy =
      query.sortby !== undefined && query.sortby != ''
        ? query.sortby == 'date'
          ? 'date:D'
          : query.sortby
        : 'date:D';
    const text =
      query.textFilter !== undefined && query.textFilter.length > 0
        ? query.textFilter
        : query.title;
    const sql = [
      // 'validservice>0',
      text != '' ? `${textField} like '*${text}*'` : '',
      bbox,
      //param2Query('type'),
      this.param2Query('ServiceType', query),
      // this.param2Query('topicCategory', query),
      // this.param2Query('Subject', query),
      // this.param2Query('Denominator', query),
      // this.param2Query('OrganisationName', query),
      // this.param2Query('keywords', query),
    ]
      .filter((n) => {
        return n != '';
      })
      .join(' AND ');
    const url =
      dataset.url +
      '?' +
      this.hsUtilsService.paramsToURL({
        request: 'GetRecords',
        format: 'application/json',
        language: dataset.language,
        query: sql,
        sortby: sortBy,
        limit: dataset.datasourcePaging.limit,
        start: dataset.datasourcePaging.start,
        validservice: '>0',
      });
    return this.hsUtilsService.proxify(url);
  }

  /**
   * @param data - HTTP response containing all the layers
   * Callback for catalogue http query
   */
  private datasetsReceived(data): boolean {
    if (!data.dataset || !data.extentFeatureCreated) {
      return;
    }
    const dataset = data.dataset;
    dataset.loading = false;
    dataset.layers = [];
    dataset.datasourcePaging.loaded = true;
    if (data.records.length == 0) {
      dataset.datasourcePaging.matched = 0;
      return false;
    } else {
      dataset.datasourcePaging.matched = data.matched;
      dataset.datasourcePaging.next = data.next;

      for (const lyr of data.records) {
        dataset.layers.push(lyr);
        if (data.extentFeatureCreated) {
          const extentFeature = addExtentFeature(
            lyr,
            this.hsMapService.getCurrentProj()
          );
          if (extentFeature) {
            lyr.featureId = extentFeature.getId();
            data.extentFeatureCreated(extentFeature);
          }
        }
      }
      return true;
    }
  }

  /**
   * @param which - Parameter name to parse
   * @param query -
   * @returns
   * Parse query parameter into encoded key value pair.
   */
  private param2Query(which: string, query): string {
    const dataset = 'type=dataset OR type=series OR type=tile';
    if (query[which] !== undefined) {
      if (which == 'type' && query[which] == 'data') {
        //Special case for type 'data' because it can contain many things
        return `(${dataset})`;
      }
      return query[which] != '' ? which + "='" + query[which] + "'" : '';
    } else {
      if (which == 'ServiceType') {
        const service = 'type=service';
        switch (query.type) {
          case 'service':
            return `(${service})`;
          case 'dataset':
            return `(${dataset})`;
          case 'all':
          default:
            return `(${service} OR ${dataset})`;
        }
      } else {
        return '';
      }
    }
  }

  /**
   * @param type -
   * @param layer - Micka layer for which to get metadata
   * @param type - Optional service type specification
   * @returns Url of service or resource
   * Get first link from records links array or link
   * property of record in older Micka versions
   * in a common format for use in add-layers component
   */
  getLayerLink(layer, type?: string): string {
    if (layer.links?.length > 0) {
      if (type) {
        layer.links = layer.links.filter(
          (link) =>
            link.url.toLowerCase().includes(type) ||
            (!Array.isArray(link) && link.includes(type))
        );
      }

      if (layer.links[0].url !== undefined) {
        return layer.links[0].url;
      } else {
        return layer.links[0];
      }
    }
    if (layer.link) {
      return layer.link;
    }
    this.log.warn('Layer does not contain any links or link properties');
  }

  /**
   * @param ds - Configuration of selected datasource (from app config)
   * @param layer - Micka layer for which to get metadata
   * @returns Promise which describes layer
   * in a common format for use in add-layers component
   * Gets layer metadata and returns promise which describes layer
   * in a common format for use in add-layers component
   */
  async describeWhatToAdd(
    ds: HsEndpoint,
    layer: HsAddDataLayerDescriptor
  ): Promise<any> {
    let whatToAdd: any = {type: 'none'};
    const type = layer.type || layer.trida;
    const layerLink = this.getLayerLink(layer);
    if (!layerLink) {
      return false;
    }
    if (type == 'service') {
      if (['WMS', 'OGC:WMS', 'view'].includes(layer.serviceType)) {
        whatToAdd.type = 'WMS';
        whatToAdd.link = layerLink;
      } else if (layerLink.toLowerCase().includes('sparql')) {
        whatToAdd = {
          type: 'sparql',
          link: layerLink,
          projection: 'EPSG:4326',
        };
      } else if (['WFS', 'OGC:WFS', 'download'].includes(layer.serviceType)) {
        whatToAdd.type = 'WFS';
        whatToAdd.link = layerLink;
        whatToAdd.dsType = ds.type;
      } else if (
        layer.formats &&
        ['kml', 'geojson', 'json'].includes(layer.formats[0].toLowerCase())
      ) {
        whatToAdd = {
          type: layer.formats[0].toUpperCase() == 'KML' ? 'kml' : 'geojson',
          link: layerLink,
          projection: 'EPSG:4326',
          extractStyles: layer.formats[0].toLowerCase() == 'kml',
        };
      } else {
        alert(`Service type "${layer.serviceType}" not supported.`);
        return false;
      }
    } else if (type == 'dataset') {
      if (layer.links) {
        //Filter invalid links
        //TODO: possible kml, geojson, shp
        layer.links = layer.links.filter((link) =>
          ['wms', 'wfs'].some((type) =>
            link.protocol?.toLowerCase().includes(type)
          )
        );
        //Check WMS endpoints
        if (
          layer.links.some((link) =>
            link.protocol?.toLowerCase().includes('wms')
          )
        ) {
          whatToAdd = {
            type: 'WMS',
          };
        }
        //Check WFS endpoints
        if (
          layer.links.some((link) =>
            link.protocol?.toLowerCase().includes('wfs')
          )
        ) {
          whatToAdd.type = whatToAdd.type == 'WMS' ? ['WMS', 'WFS'] : 'WFS';
        }
        //Parse links
        whatToAdd.link = Array.isArray(whatToAdd.type)
          ? layer.links.map((link) => link.url)
          : this.getLayerLink(layer, 'wfs');
      } else {
        return false;
      }

      // else if (
      //   ['kml', 'geojson', 'json'].includes(layer.formats[0].toLowerCase())
      // ) {
      //   whatToAdd = {
      //     type: layer.formats[0].toUpperCase() == 'KML' ? 'kml' : 'geojson',
      //     link: layerLink,
      //     projection: 'EPSG:4326',
      //     extractStyles: layer.formats[0].toLowerCase() == 'kml',
      //   };
      // }
    } else {
      alert(`Datasource type "${type}" not supported.`);
      return false;
    }
    whatToAdd.title = layer.title || 'Layer';
    whatToAdd.name = layer.title || 'Layer';
    whatToAdd.abstract = layer.abstract || 'Layer';
    return whatToAdd;
  }
}
