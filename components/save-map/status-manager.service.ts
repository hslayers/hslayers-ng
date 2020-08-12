import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsConfig} from '../../config.service';
import {HsSaverService} from './saver-service';
import {HsUtilsService} from '../utils/utils.service';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsStatusManagerService implements HsSaverService {
  constructor(
    private http: HttpClient,
    private HsConfig: HsConfig,
    private HsUtilsService: HsUtilsService,
    private HsCommonEndpointsService: HsCommonEndpointsService
  ) {}

  endpointUrl() {
    let hostName = location.protocol + '//' + location.host;
    if (this.HsConfig.hostname) {
      if (
        this.HsConfig.hostname.status_manager &&
        this.HsConfig.hostname.status_manager.url
      ) {
        return this.HsConfig.hostname.status_manager.url;
      }
      if (this.HsConfig.hostname.user && this.HsConfig.hostname.user.url) {
        hostName = this.HsConfig.hostname.user.url;
      } else if (
        this.HsConfig.hostname.default &&
        this.HsConfig.hostname.default.url
      ) {
        hostName = this.HsConfig.hostname.default.url;
      }
    }
    if (
      this.HsConfig.status_manager_url &&
      this.HsConfig.status_manager_url.indexOf('://') > -1
    ) {
      //Full url specified
      return this.HsConfig.status_manager_url;
    } else {
      return (
        hostName +
        (this.HsConfig.status_manager_url ||
          '/wwwlibs/statusmanager2/index.php')
      );
    }
  }

  findStatusmanagerEndpoint() {
    const found = this.HsCommonEndpointsService.endpoints.filter(
      (e) => e.type == 'status_manager'
    );
    if (found.length > 0) {
      return found[0];
    }
  }

  save(compositionJson, endpoint, compoData, saveAsNew) {
    if (saveAsNew || compoData.id == '') {
      compoData.id = this.HsUtilsService.generateUuid();
    }
    return new Promise(async (resolve, reject) => {
      try {
        const response = await this.http
          .post(this.endpointUrl(), {
            data: compositionJson,
            permanent: true,
            id: compoData.id,
            project: this.HsConfig.project_name,
            thumbnail: compoData.thumbnail,
            request: 'save',
          })
          .toPromise();
        resolve(response);
      } catch (err) {
        reject();
      }
    });
  }
}
