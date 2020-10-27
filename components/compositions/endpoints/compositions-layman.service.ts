/**
 * @param $rootScope
 * @param $q
 * @param $http
 * @param HsUtilsService
 * @param HsCompositionsParserService
 */
export default function (
  $rootScope,
  $q,
  $http,
  HsUtilsService,
  HsCompositionsParserService,
  HsEventBusService
) {
  'ngInject';
  const me = this;
  angular.extend(me, {
    data: {},
    loadList(endpoint, params, bbox, extentLayer) {
      endpoint.getCurrentUserIfNeeded(endpoint);
      endpoint.compositionsPaging.loaded = false;
      if (angular.isUndefined(params.sortBy)) {
        params.sortBy = '';
      }
      return new Promise(async (resolve, reject) => {
        try {
          if (angular.isDefined(me.canceler)) {
            me.canceler.resolve();
            delete me.canceler;
          }
          me.canceler = $q.defer();
          let response = await $http.get(
            `${endpoint.url}/rest/${endpoint.user}/maps`,
            {
              timeout: me.canceler.promise,
            }
          );

          endpoint.compositionsPaging.loaded = true;
          response = response.data;
          endpoint.compositions = response;
          if (response && response.length > 0) {
            endpoint.compositionsPaging.compositionsCount = response.length;
          } else {
            endpoint.compositionsPaging.compositionsCount = 0;
          }
          angular.forEach(endpoint.compositions, (record) => {
            record.editable = true;
            record.endpoint = endpoint;
          });
          $rootScope.$broadcast('CompositionsLoaded');
          resolve();
        } catch (ex) {
          reject(ex);
        }
      });
    },

    async delete(endpoint, composition) {
      let url = `${endpoint.url}/rest/${endpoint.user}/maps/${composition.name}`;
      const method = 'DELETE';
      url = HsUtilsService.proxify(url);
      await $http({url, method});
      HsEventBusService.compositionDeletes.next(composition);
    },

    getInfo(composition) {
      return new Promise((resolve, reject) => {
        const endpoint = composition.endpoint;
        const url = `${endpoint.url}/rest/${endpoint.user}/maps/${composition.name}`;
        HsCompositionsParserService.loadInfo(url, (info) => {
          if (
            angular.isDefined(info.thumbnail.status) &&
            info.thumbnail.status == 'NOT_AVAILABLE'
          ) {
            delete info.thumbnail;
          }
          info.abstract = info.description;
          resolve(info);
        });
      });
    },

    resetCompositionCounter(endpoint) {
      endpoint.compositionsPaging.start = 0;
      endpoint.compositionsPaging.next = me.data.limit;
    },
  });
  return me;
}
