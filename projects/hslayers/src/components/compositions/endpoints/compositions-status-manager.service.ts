import {HsConfig} from '../../../config.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLanguageService} from '../../language/language.service';
import {HsStatusManagerService} from '../../save-map/status-manager.service';
import {HsToastService} from '../../layout/toast/toast.service';
import {HsUtilsService} from '../../utils/utils.service';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {catchError, map, timeout} from 'rxjs/operators';
import {of} from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class HsCompositionsStatusManagerService {
  constructor(
    public HsStatusManagerService: HsStatusManagerService,
    public HsConfig: HsConfig,
    public HsUtilsService: HsUtilsService,
    private $http: HttpClient,
    public HsEventBusService: HsEventBusService,
    public HsToastService: HsToastService,
    public HsLanguageService: HsLanguageService
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
    if (ds.listLoading) {
      ds.listLoading.unsubscribe();
      delete ds.listLoading;
    }
    const listLoading = this.$http.get(url).pipe(
      timeout(2000),
      map((response: any) => response),
      catchError((e) => {
        this.HsToastService.createToastPopupMessage(
          this.HsLanguageService.getTranslation(
            'COMPOSITIONS.errorWhileRequestingCompositions'
          ),
          ds.title +
            ': ' +
            this.HsLanguageService.getTranslationIgnoreNonExisting(
              'ERRORMESSAGES',
              e.status.toString() || e.message,
              {url: url}
            ),
          true
        );
        return of(e);
      })
    );
    ds.listLoading = listLoading.subscribe(
      (response: any) => {
        if (response.results === undefined) {
          return;
        }
        if (ds.compositions === undefined) {
          ds.compositions = [];
          ds.matched = 0;
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
              ds.matched = ds.matched + 1;
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
    url = this.HsUtilsService.proxify(url);
    this.$http.get(url).toPromise();
    this.HsEventBusService.compositionDeletes.next(composition);
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
