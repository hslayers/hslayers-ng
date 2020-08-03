/**
 * @param $http
 * @param HsConfig
 * @param HsUtilsService
 */
export class HsStatusManagerService {
  constructor($http, HsConfig, HsUtilsService) {
    'ngInject';

    Object.assign(this, {
      $http,
      HsConfig,
      HsUtilsService,
    });
  }

  endpointUrl() {
    let hostName = location.protocol + '//' + location.host;
    if (angular.isDefined(this.HsConfig.hostname)) {
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
      angular.isDefined(this.HsConfig.status_manager_url) &&
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

  save(compositionJson, endpoint, compoData, saveAsNew) {
    if (saveAsNew || compoData.id == '') {
      compoData.id = this.HsUtilsService.generateUuid();
    }
    return new Promise((resolve, reject) => {
      this.$http({
        url: this.endpointUrl(),
        method: 'POST',
        data: angular.toJson({
          data: compositionJson,
          permanent: true,
          id: compoData.id,
          project: this.HsConfig.project_name,
          thumbnail: compoData.thumbnail,
          request: 'save',
        }),
      }).then(
        (response) => {
          resolve(response);
        },
        (err) => {
          reject();
        }
      );
    });
  }
}
