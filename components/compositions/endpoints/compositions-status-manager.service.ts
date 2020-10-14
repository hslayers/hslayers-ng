import {HsConfig} from '../../../config.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsStatusManagerService} from '../../save-map/status-manager.service';
import {HsUtilsService} from '../../utils/utils.service';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsStatusManagerService {
  constructor(
    private HsStatusManagerService: HsStatusManagerService,
    private HsConfig: HsConfig,
    private HsUtilsService: HsUtilsService,
    private $http: HttpClient,
    private HsEventBusService: HsEventBusService
  ) {}
  /**
   * @ngdoc method
   * @name HsCompositionsService#loadList
   * @public
   * @description Load list of compositions according to current
   * filter values and pager position (filter, keywords, current
   * extent, start composition, compositions number per page).
   * Display compositions extent in map. Loops through the existing
   * list of compositions, and when a composition is
   * found in statusmanagers list, then it becomes editable.
   * @param ds
   * @param params
   * @param bbox
   */
  loadList(ds, params, bbox) {
    let url = this.HsStatusManagerService.endpointUrl();
    const query = params.query;
    const textFilter =
      query && query.title !== undefined && query.title != ''
        ? '&q=' + encodeURIComponent('*' + query.title + '*')
        : '';
    url +=
      '?request=list&project=' +
      encodeURIComponent(this.HsConfig.project_name) +
      '&extent=' +
      bbox.join(',') +
      textFilter +
      '&start=0&limit=1000&sort=' +
      getStatusSortAttr(params.sortBy);
    url = this.HsUtilsService.proxify(url);
    if (me.canceler) {
      me.canceler.resolve();
      delete me.canceler;
    }
    me.canceler = $q.defer();
    this.$http.get(url, {timeout: me.canceler.promise}).then(
      (response) => {
        response = response.data;
        if (ds.compositions == undefined) {
          ds.compositions = [];
          ds.compositionsCount = 0;
        }
        for (const record of response.results) {
          let found = false;
          for (const composition of ds.compositions) {
            if (composition.id == record.id) {
              if (record.edit !== undefined) {
                composition.editable = record.edit;
              }
              found = true;
            }
          }
          if (!found) {
            record.editable = false;
            if (record.edit !== undefined) {
              record.editable = record.edit;
            }
            if (record.link == undefined) {
              record.link =
                this.HsStatusManagerService.endpointUrl() +
                '?request=load&id=' +
                record.id;
            }
            if (record.thumbnail == undefined) {
              record.thumbnail =
                this.HsStatusManagerService.endpointUrl() +
                '?request=loadthumb&id=' +
                record.id;
            }
            const attributes: any = {
              record: record,
              hs_notqueryable: true,
              highlighted: false,
            };
            if (record) {
              ds.compositions.push(record);
              ds.compositionsCount = ds.compositionsCount + 1;
            }
          }
        }
      },
      (err) => {
        //Do nothing
      }
    );
  }

  delete(endpoint, composition) {
    let url =
      this.HsStatusManagerService.endpointUrl() +
      '?request=delete&id=' +
      composition.id +
      '&project=' +
      encodeURIComponent(this.HsConfig.project_name);
    const method = 'GET';
    url = this.HsUtilsService.proxify(url);
    $http({url, method}).then(
      (response) => {
        this.HsEventBusService.compositionDeletes.next(composition);
      },
      (err) => {
        //Do nothing
      }
    );
  }
}

/**
 * @param sortBy
 */
function getStatusSortAttr(sortBy) {
  const sortMap = {
    bbox: '[{"property":"bbox","direction":"ASC"}]',
    title: '[{"property":"title","direction":"ASC"}]',
    date: '[{"property":"date","direction":"ASC"}]',
  };
  return encodeURIComponent(sortMap[sortBy]);
}
