import {Injectable} from '@angular/core';

import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

import {
  EndpointErrorHandler,
  EndpointErrorHandling,
  HsEndpoint,
  isErrorHandlerFunction,
} from '../../../common/endpoints/endpoint.interface';
import {HsCompositionsMickaService} from './compositions-micka.service';
import {HsCompositionsParserService} from '../compositions-parser.service';
import {HsCompositionsStatusManagerService} from './compositions-status-manager.service';
import {HsLanguageService} from '../../language/language.service';
import {HsToastService} from '../../layout/toast/toast.service';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsStatusManagerMickaJointService {
  constructor(
    private hsCompositionsStatusManagerService: HsCompositionsStatusManagerService,
    private hsCompositionsMickaService: HsCompositionsMickaService,
    private hsCompositionsParserService: HsCompositionsParserService,
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
   */
  loadList(
    ds: HsEndpoint,
    params,
    extentFeatureCreated,
    bbox,
    app: string
  ): Observable<any> {
    const Observable = this.hsCompositionsMickaService
      .loadList(ds, params, extentFeatureCreated, bbox, app)
      .pipe(
        map((response: any) => {
          this.hsCompositionsStatusManagerService.loadList(
            ds,
            params,
            bbox,
            app
          );
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
                    {url: ds.url},
                    app
                  ),
                {
                  disableLocalization: true,
                  serviceCalledFrom:
                    'HsCompositionsStatusManagerMickaJointService',
                },
                app
              );
          }
          return of(e);
        })
      );
    return Observable;
  }
  /**
   * Get information about the selected composition
   * @param composition - Composition selected
   * @param app - App identifier
   */
  async getInfo(composition, app: string): Promise<any> {
    const compLinks = composition.link || composition.links;
    if (compLinks === undefined) {
      return;
    }
    const compUrls = this.getCompositionUrls(compLinks);
    let info: any = {};
    let url = '';
    Array.isArray(compUrls) ? (url = compUrls[0]) : (url = compUrls);
    try {
      info = await this.hsCompositionsParserService.loadInfo(url, app);
      //TODO: find out if this is even available
      // info.thumbnail = this.HsUtilsService.proxify(composition.thumbnail);
      info.metadata = {
        record_url:
          composition.endpoint.url.replace('csw', 'record/basic/') +
          composition.id,
      };
      return info;
    } catch (e) {
      this.hsToastService.createToastPopupMessage(
        this.hsLanguageService.getTranslation(
          'COMPOSITIONS.errorWhileLoadingCompositionMetadata',
          undefined,
          app
        ),
        this.hsLanguageService.getTranslationIgnoreNonExisting(
          'ERRORMESSAGES',
          e.status ? e.status.toString() : e.message,
          {url: url},
          app
        ),
        {
          disableLocalization: true,
          serviceCalledFrom: 'HsCompositionsStatusManagerMickaJointService',
        },
        app
      );
    }
  }

  /**
   * Delete selected composition from endpoint database
   * @param endpoint - Endpoint selected
   * @param composition - Composition to be deleted
   * @param app - App identifier
   */
  async delete(endpoint, composition, app): Promise<void> {
    await this.hsCompositionsStatusManagerService.delete(
      endpoint,
      composition,
      app
    );
  }
  /**
   * Get composition urls
   * @param compData - Composition data
   */
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
