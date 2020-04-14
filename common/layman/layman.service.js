export default [
  '$http',
  '$rootScope',
  function ($http, $rootScope) {
    const me = this;
    angular.extend(me, {
      getCurrentUser(endpoint) {
        const url = `${endpoint.url}/rest/current-user`;
        return new Promise((resolve, reject) => {
          $http.get(url).then(
            (res) => {
              let somethingChanged = false;
              if (res.data.username) {
                if (endpoint.user != res.data.username) {
                  endpoint.user = res.data.username;
                  somethingChanged = true;
                  $rootScope.$broadcast(
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
      async getCurrentUserIfNeeded() {
        const endpoint = this;
        if (
          angular.isUndefined(endpoint.user) ||
          ['anonymous', 'browser'].indexOf(endpoint.user) > -1
        ) {
          await me.getCurrentUser(endpoint);
        }
      },
    });
    return me;
  },
];
