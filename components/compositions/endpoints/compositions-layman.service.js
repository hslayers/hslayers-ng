export default [
  '$rootScope',
  'hs.compositions.service_parser',
  'config',
  '$q',
  '$http',
  'hs.map.service',
  'hs.utils.service',
  'hs.common.laymanService',
  function (
    $rootScope,
    compositionParser,
    config,
    $q,
    $http,
    hsMap,
    utils,
    commonLaymanService
  ) {
    const me = this;
    angular.extend(me, {
      data: {},
      loadList(endpoint, params, bbox, extentLayer) {
        endpoint.getCurrentUserIfNeeded();
        endpoint.compositionsPaging.loaded = false;
        if (angular.isUndefined(params.sortBy)) {
          params.sortBy = 'bbox';
        }
        return new Promise((resolve, reject) => {
          if (angular.isDefined(me.canceler)) {
            me.canceler.resolve();
            delete me.canceler;
          }
          me.canceler = $q.defer();
          $http
            .get(`${endpoint.url}/rest/${endpoint.user}/maps`, {
              timeout: me.canceler.promise,
            })
            .then(
              (response) => {
                endpoint.compositionsPaging.loaded = true;
                response = response.data;
                endpoint.compositions = response;
                if (response && response.length > 0) {
                  endpoint.compositionsPaging.compositionsCount =
                    response.length;
                } else {
                  endpoint.compositionsPaging.compositionsCount = 0;
                }
                angular.forEach(endpoint.compositions, (record) => {
                  record.editable = true;
                  record.endpoint = endpoint;
                });
                $rootScope.$broadcast('CompositionsLoaded');
                resolve();
              },
              (err) => {}
            );
        });
      },

      resetCompositionCounter(endpoint) {
        endpoint.compositionsPaging.start = 0;
        endpoint.compositionsPaging.next = me.data.limit;
      },
    });
    return me;
  },
];
