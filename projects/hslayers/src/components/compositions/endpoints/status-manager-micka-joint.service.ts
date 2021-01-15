import {EMPTY, Observable} from 'rxjs';
import {HsCompositionsMapService} from '../compositions-map.service';
import {HsCompositionsMickaService} from './compositions-micka.service';
import {HsCompositionsParserService} from '../compositions-parser.service';
import {HsCompositionsStatusManagerService} from './compositions-status-manager.service';
import {HsUtilsService} from '../../utils/utils.service';
import {Injectable} from '@angular/core';
import {catchError, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsStatusManagerMickaJointService {
  constructor(
    public HsCompositionsStatusManagerService: HsCompositionsStatusManagerService,
    public HsCompositionsMickaService: HsCompositionsMickaService,
    public HsCompositionsMapService: HsCompositionsMapService,
    public HsCompositionsParserService: HsCompositionsParserService,
    public HsUtilsService: HsUtilsService
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
  loadList(ds, params, bbox): Observable<any> {
    const Observable = this.HsCompositionsMickaService.loadList(
      ds,
      params,
      bbox,
      this.HsCompositionsMapService.extentLayer
    ).pipe(
      map((response: any) => {
        this.HsCompositionsStatusManagerService.loadList(ds, params, bbox);
      }),
      catchError((e) => {
        return EMPTY;
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
    const info: any = {};
    if (Array.isArray(compUrls)) {
      for (const url of compUrls) {
        info.text = await this.HsCompositionsParserService.loadInfo(url);
      }
    } else {
      info.text = await this.HsCompositionsParserService.loadInfo(compUrls);
    }
    info.thumbnail = this.HsUtilsService.proxify(composition.thumbnail);
    return info;
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
