/**
 * @param $http
 * @param HsConfig
 * @param HsUtilsService
 */
export default function ($http, HsConfig, HsUtilsService) {
  'ngInject';
  const me = this;
  angular.extend(me, {
    endpointUrl() {
      let hostName = location.protocol + '//' + location.host;
      if (angular.isDefined(HsConfig.hostname)) {
        if (
          HsConfig.hostname.status_manager &&
          HsConfig.hostname.status_manager.url
        ) {
          return HsConfig.hostname.status_manager.url;
        }
        if (HsConfig.hostname.user && HsConfig.hostname.user.url) {
          hostName = HsConfig.hostname.user.url;
        } else if (HsConfig.hostname.default && HsConfig.hostname.default.url) {
          hostName = HsConfig.hostname.default.url;
        }
      }
      if (
        angular.isDefined(HsConfig.status_manager_url) &&
        HsConfig.status_manager_url.indexOf('://') > -1
      ) {
        //Full url specified
        return HsConfig.status_manager_url;
      } else {
        return (
          hostName +
          (HsConfig.status_manager_url || '/wwwlibs/statusmanager2/index.php')
        );
      }
    },
    save(compositionJson, endpoint, compoData, saveAsNew) {
      if (saveAsNew || compoData.id == '') {
        compoData.id = HsUtilsService.generateUuid();
      }
      return new Promise((resolve, reject) => {
        $http({
          url: me.endpointUrl(),
          method: 'POST',
          data: angular.toJson({
            data: compositionJson,
            permanent: true,
            id: compoData.id,
            project: HsConfig.project_name,
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
    },
  });
  return me;
}
