import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {catchError, lastValueFrom, map, of, timeout} from 'rxjs';

import {
  EndpointErrorHandler,
  EndpointErrorHandling,
  isErrorHandlerFunction,
} from '../../../common/endpoints/endpoint.interface';
import {HsConfig} from '../../../config.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLanguageService} from '../../language/language.service';
import {HsShareUrlService} from '../../permalink/share-url.service';
import {HsToastService} from '../../layout/toast/toast.service';
import {HsUtilsService} from '../../utils/utils.service';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsStatusManagerService {
  constructor(
    private HsShareUrlService: HsShareUrlService,
    private hsConfig: HsConfig,
    private hsUtilsService: HsUtilsService,
    private $http: HttpClient,
    private hsEventBusService: HsEventBusService,
    private hsToastService: HsToastService,
    private hsLanguageService: HsLanguageService
  ) {}
  /**
   * @public
   * Load list of compositions according to current
   * filter values and pager position (filter, keywords, current
   * extent, start composition, compositions number per page).
   * Display compositions extent in map. Loops through the existing
   * list of compositions, and when a composition is
   * found in statusmanagers list, then it becomes editable.
   * @param ds - Datasource selected
   * @param params - HTML query params
   * @param bbox - Bounding box
   * @param app - App identifier
   */
  loadList(ds, params, bbox: number[], app: string) {
    let url = this.HsShareUrlService.endpointUrl(app);
    const query = params.query;
    const textFilter =
      query && query.title !== undefined && query.title != ''
        ? '&q=' + encodeURIComponent('*' + query.title + '*')
        : '';
    url +=
      '?request=list&project=' +
      encodeURIComponent(this.hsConfig.get(app).project_name) +
      '&extent=' +
      bbox.join(',') +
      textFilter +
      '&start=0&limit=1000&sort=' +
      getStatusSortAttr(params.sortBy);
    url = this.hsUtilsService.proxify(url, app);
    if (ds.listLoading) {
      ds.listLoading.unsubscribe();
      delete ds.listLoading;
    }
    const listLoading = this.$http.get(url).pipe(
      timeout(2000),
      map((response: any) => response),
      catchError((e) => {
        if (isErrorHandlerFunction(ds.onError?.compositionLoad)) {
          (<EndpointErrorHandler>ds.onError?.compositionLoad).handle(ds, e);
          return of(e);
        }
        switch (ds.onError?.compositionLoad) {
          case EndpointErrorHandling.ignore:
            break;
          case EndpointErrorHandling.toast:
          default:
            this.hsToastService.createToastPopupMessage(
              this.hsLanguageService.getTranslation(
                'COMPOSITIONS.errorWhileRequestingCompositions',
                undefined,
                app
              ),
              ds.title +
                ': ' +
                this.hsLanguageService.getTranslationIgnoreNonExisting(
                  'ERRORMESSAGES',
                  e.status ? e.status.toString() : e.message,
                  {url: url},
                  app
                ),
              {
                disableLocalization: true,
                serviceCalledFrom: 'HsCompositionsStatusManagerService',
              },
              app
            );
        }
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
                this.HsShareUrlService.endpointUrl(app) +
                '?request=load&id=' +
                record.id;
            }
            if (record.thumbnail == undefined) {
              record.thumbnail =
                this.HsShareUrlService.endpointUrl(app) +
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

  /**
   * Delete selected composition
   * @param endpoint - Endpoint selected
   * @param composition - Composition to be deleted
   * @param app - App identifier
   */
  async delete(endpoint, composition, app: string): Promise<void> {
    let url =
      this.HsShareUrlService.endpointUrl(app) +
      '?request=delete&id=' +
      composition.id +
      '&project=' +
      encodeURIComponent(this.hsConfig.get(app).project_name);
    url = this.hsUtilsService.proxify(url, app);
    await lastValueFrom(this.$http.get(url));
    this.hsEventBusService.compositionDeletes.next({composition, app});
  }
}

/**
 * Get status manager sort attribute value
 * @param sortBy - Sorting value
 */
function getStatusSortAttr(sortBy) {
  const sortMap = {
    bbox: '[{"property":"bbox","direction":"ASC"}]',
    title: '[{"property":"title","direction":"ASC"}]',
    date: '[{"property":"date","direction":"ASC"}]',
  };
  return encodeURIComponent(sortMap[sortBy]);
}
