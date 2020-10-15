import Feature from 'ol/Feature';
import {fromExtent as polygonFromExtent} from 'ol/geom/Polygon';

import {HsCompositionsParserService} from '../compositions-parser.service';
import {HsMapService} from '../../map/map.service';
import {HsUtilsService} from '../../utils/utils.service';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsMickaService {
  constructor(
    private HsCompositionsParserService: HsCompositionsParserService,
    private $http: HttpClient,
    private HsMapService: HsMapService,
    private HsUtilsService: HsUtilsService
  ) {}

  getCompositionsQueryUrl(endpoint, params, bbox) {
    const query = params.query;
    const bboxDelimiter =
      endpoint.url.indexOf('cswClientRun.php') > 0 ? ',' : ' ';
    const serviceName =
      endpoint.serviceName !== undefined
        ? 'serviceName=&' + endpoint.serviceName
        : '';
    bbox = params.filterExtent
      ? encodeURIComponent(" and BBOX='" + bbox.join(bboxDelimiter) + "'")
      : '';
    const textFilter =
      query && query.title !== undefined && query.title != ''
        ? encodeURIComponent(
            " AND title like '*" +
              query.title +
              "*' OR abstract like '*" +
              query.title +
              "*'"
          )
        : '';
    const selected = [];
    let keywordFilter = '';
    let tmp = endpoint.url;
    for (const key of Object.keys(params.keywords)) {
      if (params.keywords[key]) {
        selected.push("subject='" + key + "'");
      }
    }
    if (selected.length > 0) {
      keywordFilter = encodeURIComponent(
        ' AND (' + selected.join(' OR ') + ')'
      );
    }

    tmp +=
      '?format=json&' +
      serviceName +
      'query=type%3Dapplication' +
      bbox +
      textFilter +
      keywordFilter +
      '&lang=eng&sortBy=' +
      params.sortBy +
      '&detail=summary&start=' +
      params.start +
      '&limit=' +
      params.limit;
    tmp = this.HsUtilsService.proxify(tmp);
    return tmp;
  }

  loadList(endpoint, params, bbox, extentLayer) {
    endpoint.compositionsPaging.loaded = false;
    if (params.sortBy == undefined) {
      params.sortBy = 'title';
    }
    if (params.start == undefined) {
      params.start = endpoint.compositionsPaging.start;
    }
    if (params.limit == undefined || isNaN(params.limit)) {
      params.limit = endpoint.compositionsPaging.limit;
    }
    return new Promise((resolve, reject) => {
      if (angular.isDefined(this.canceler)) {
        this.canceler.resolve();
        delete this.canceler;
      }
      this.canceler = $q.defer();
      this.$http
        .get(this.getCompositionsQueryUrl(endpoint, params, bbox), {
          timeout: this.canceler.promise,
        })
        .then(
          (response) => {
            endpoint.compositionsPaging.loaded = true;
            response = response.data;
            endpoint.compositions = response.records;
            if (response.records && response.records.length > 0) {
              endpoint.compositionsPaging.matched = response.matched;
            } else {
              endpoint.compositionsPaging.matched = 0;
            }
            //TODO: Needs refactoring
            endpoint.compositionsPaging.next = response.next;
            const mapExtent = this.HsMapService.getMapExtent();
            for (const record of endpoint.compositions) {
              const attributes: any = {
                record: record,
                hs_notqueryable: true,
                highlighted: false,
                title: record.title || record.name,
              };
              record.editable = false;
              record.endpoint = endpoint;
              if (record.thumbnail == undefined) {
                record.thumbnail =
                  endpoint.url + '?request=loadthumb&id=' + record.id;
              }
              const extent = this.HsCompositionsParserService.parseExtent(
                record.bbox
              );
              //Check if height or Width covers the whole screen
              if (
                !(
                  (extent[0] < mapExtent[0] && extent[2] > mapExtent[2]) ||
                  (extent[1] < mapExtent[1] && extent[3] > mapExtent[3])
                )
              ) {
                attributes.geometry = polygonFromExtent(extent);
                attributes.is_hs_composition_extent = true;
                const newFeature = new Feature(attributes);
                record.feature = newFeature;
                extentLayer.getSource().addFeatures([newFeature]);
              } else {
                //Composition not in extent
              }
            }
            resolve();
          },
          (err) => {}
        );
    });
  }

  resetCompositionCounter(endpoint) {
    endpoint.compositionsPaging.start = 0;
    endpoint.compositionsPaging.next = endpoint.compositionsPaging.limit;
  }
}
