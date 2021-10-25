import {Injectable} from '@angular/core';

import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

import {
  EndpointErrorHandler,
  EndpointErrorHandling,
  HsEndpoint,
  isErrorHandlerFunction,
} from '../../../common/endpoints/endpoint.interface';
import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsCompositionsMapService} from '../compositions-map.service';
import {HsCompositionsMickaService} from './compositions-micka.service';
import {HsCompositionsParserService} from '../compositions-parser.service';
import {HsCompositionsStatusManagerService} from './compositions-status-manager.service';
import {HsLanguageService} from '../../language/language.service';
import {HsToastService} from '../../layout/toast/toast.service';
import {HsUtilsService} from '../../utils/utils.service';
@Injectable({
  providedIn: 'root',
})
export class HsCompositionsStatusManagerMickaJointService {
  constructor(
    public HsCompositionsStatusManagerService: HsCompositionsStatusManagerService,
    public HsCompositionsMickaService: HsCompositionsMickaService,
    public HsCompositionsMapService: HsCompositionsMapService,
    public HsCompositionsParserService: HsCompositionsParserService,
    public HsUtilsService: HsUtilsService,
    public HsToastService: HsToastService,
    public HsLanguageService: HsLanguageService,
    public HsCommonEndpointsService: HsCommonEndpointsService
  ) {}
  /**
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
  loadList(
    ds: HsEndpoint,
    params,
    extentFeatureCreated,
    bbox
  ): Observable<any> {
    const Observable = this.HsCompositionsMickaService.loadList(
      ds,
      params,
      extentFeatureCreated,
      bbox
    ).pipe(
      map((response: any) => {
        this.HsCompositionsStatusManagerService.loadList(ds, params, bbox);
      }),
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
            this.HsToastService.createToastPopupMessage(
              this.HsLanguageService.getTranslation(
                'COMPOSITIONS.errorWhileRequestingCompositions'
              ),
              ds.title +
                ': ' +
                this.HsLanguageService.getTranslationIgnoreNonExisting(
                  'ERRORMESSAGES',
                  e.status ? e.status.toString() : e.message,
                  {url: ds.url}
                ),
              {
                disableLocalization: true,
                serviceCalledFrom:
                  'HsCompositionsStatusManagerMickaJointService',
              }
            );
        }
        return of(e);
      })
    );
    return Observable;
  }
  async getInfo(composition): Promise<any> {
    const compLinks = composition.link || composition.links;
    if (compLinks === undefined) {
      return;
    }
    const compUrls = this.getCompositionUrls(compLinks);
    let info: any = {};
    let url = '';
    Array.isArray(compUrls) ? (url = compUrls[0]) : (url = compUrls);
    try {
      info = await this.HsCompositionsParserService.loadInfo(url);
      //TODO: find out if this is even available
      // info.thumbnail = this.HsUtilsService.proxify(composition.thumbnail);
      info.metadata = {
        record_url:
          composition.endpoint.url.replace('csw', 'record/basic/') +
          composition.id,
      };
      return info;
    } catch (e) {
      this.HsToastService.createToastPopupMessage(
        this.HsLanguageService.getTranslation(
          'COMPOSITIONS.errorWhileLoadingCompositionMetadata'
        ),
        this.HsLanguageService.getTranslationIgnoreNonExisting(
          'ERRORMESSAGES',
          e.status ? e.status.toString() : e.message,
          {url: url}
        ),
        {
          disableLocalization: true,
          serviceCalledFrom: 'HsCompositionsStatusManagerMickaJointService',
        }
      );
    }
  }

  delete(endpoint, composition) {
    this.HsCompositionsStatusManagerService.delete(endpoint, composition);
  }
  getCompositionUrls(compData: any): string | Array<string> {
    if (typeof compData == 'string') {
      return compData;
    }
    if (typeof compData == 'object' && compData.url !== undefined) {
      return compData.url;
    }
    return compData.map((link) =>
      typeof link == 'object' && link.url !== undefined ? link.url : link
    );
  }
}
