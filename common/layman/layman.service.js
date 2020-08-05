export class HsCommonLaymanService {
  constructor($http, $rootScope) {
    'ngInject';
    Object.assign(this, {
      $http,
      $rootScope,
    });
    angular.extend(this, {
      getCurrentUser(endpoint) {
        const url = `${endpoint.url}/rest/current-user`;
        return new Promise((resolve, reject) => {
          this.$http.get(url).then(
            (res) => {
              let somethingChanged = false;
              if (res.data.username) {
                if (endpoint.user != res.data.username) {
                  endpoint.user = res.data.username;
                  somethingChanged = true;
                  this.$rootScope.$broadcast(
                    'datasource-selector.layman_auth',
                    endpoint
                  );
                }
              } else {
                if (endpoint.user != endpoint.originalConfiguredUser) {
                  somethingChanged = true;
                }
                endpoint.user = endpoint.originalConfiguredUser;
              }
              resolve(somethingChanged);
            },
            (e) => {
              reject(e);
            }
          );
        });
      },
    });
  }

  async getCurrentUserIfNeeded(endpoint) {
    if (
      angular.isUndefined(endpoint.user) ||
      ['anonymous', 'browser'].indexOf(endpoint.user) > -1
    ) {
      await this.getCurrentUser(endpoint);
    }
  }
}
