import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {lastValueFrom} from 'rxjs';

import {CompoData} from '../types/compo-data.type';
import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsConfig} from '../../../config.service';
import {HsEndpoint} from './../../../common/endpoints/endpoint.interface';
import {HsSaverService} from './../interfaces/saver-service.interface';
import {HsUtilsService} from '../../utils/utils.service';
import {MapComposition} from './../types/map-composition.type';
@Injectable({
  providedIn: 'root',
})
export class HsStatusManagerService implements HsSaverService {
  constructor(
    private http: HttpClient,
    private hsConfig: HsConfig,
    private hsUtilsService: HsUtilsService,
    private hsCommonEndpointsService: HsCommonEndpointsService
  ) {}

  /**
   * Get status manager endpoint's url
   * @param app - App identifier
   */
  endpointUrl(app: string): string {
    let hostName = location.protocol + '//' + location.host;

    if (this.hsConfig.get(app).hostname?.status_manager?.url) {
      return this.hsConfig.get(app).hostname.status_manager.url;
    }
    if (this.hsConfig.get(app).hostname?.user?.url) {
      hostName = this.hsConfig.get(app).hostname.user.url;
    } else if (this.hsConfig.get(app).hostname?.default?.url) {
      hostName = this.hsConfig.get(app).hostname.default.url;
    }

    if (this.hsConfig.get(app).status_manager_url?.includes('://')) {
      //Full url specified
      return this.hsConfig.get(app).status_manager_url;
    } else {
      return (
        hostName + (this.hsConfig.get(app).status_manager_url || '/share/')
      );
    }
  }

  /**
   * Get status manager endpoint's description
   * @returns Status manager's endpoint
   */
  findStatusmanagerEndpoint(): HsEndpoint {
    const found = this.hsCommonEndpointsService.endpoints.filter(
      (e) => e.type == 'status_manager'
    );
    if (found.length > 0) {
      return found[0];
    }
  }

  /**
   * Save composition to Status manager's service
   * @param compositionJson - Json with composition's definition
   * @param endpoint - Endpoint's description
   * @param compoData - Additional data for composition
   * @param saveAsNew - Save as new composition
   * @returns Promise result of POST
   */
  save(
    compositionJson: MapComposition,
    endpoint: HsEndpoint,
    compoData: CompoData,
    saveAsNew: boolean,
    app: string
  ): Promise<any> {
    if (saveAsNew || compoData.id == '') {
      compoData.id = this.hsUtilsService.generateUuid();
    }
    return new Promise(async (resolve, reject) => {
      try {
        const response = await lastValueFrom(
          this.http.post(this.endpointUrl(app), {
            data: compositionJson,
            permanent: true,
            id: compoData.id,
            project: this.hsConfig.get(app).project_name,
            thumbnail: compoData.thumbnail,
            request: 'save',
          })
        );
        resolve(response);
      } catch (err) {
        reject();
      }
    });
  }
}
