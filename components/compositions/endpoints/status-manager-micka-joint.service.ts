import {HsCompositionsMapService} from '../compositions-map.service';
import {HsCompositionsMickaService} from './compositions-micka.service';
import {HsCompositionsParserService} from '../compositions-parser.service';
import {HsCompositionsStatusManagerService} from './compositions-status-manager.service';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsStatusManagerMickaJointService {
  constructor(
    private HsCompositionsStatusManagerService: HsCompositionsStatusManagerService,
    private HsCompositionsMickaService: HsCompositionsMickaService,
    private HsCompositionsMapService: HsCompositionsMapService,
    private HsCompositionsParserService: HsCompositionsParserService
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
    return new Promise((resolve, reject) => {
      this.HsCompositionsMickaService.loadList(
        ds,
        params,
        bbox,
        this.HsCompositionsMapService.extentLayer
      ).then(() => {
        this.HsCompositionsStatusManagerService.loadList(ds, params, bbox);
        resolve();
      });
    });
  }

  async getInfo(composition): Promise<any> {
    const url = composition.link;
    const info = await this.HsCompositionsParserService.loadInfo(url);
    info.thumbnail = composition.thumbnail;
  }

  delete(endpoint, composition) {
    this.HsCompositionsStatusManagerService.delete(endpoint, composition);
  }
}
