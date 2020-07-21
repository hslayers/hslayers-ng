import * as angular from 'angular';
/**
 * @param $http
 * @param $q
 * @param HsUtilsService
 */
export const HsLaymanService = function ($http, $q, HsUtilsService) {
  'ngInject';
  const me = this;
  angular.extend(me, {
    /**
     * @function queryCatalog
     * @param {Object} endpoint Configuration of selected datasource (from app config)
     * extent feature is created. Has one parameter: feature
     * @description Loads datasets metadata from Layman
     */
    queryCatalog(endpoint) {
      endpoint.getCurrentUserIfNeeded(endpoint);
      let url = `${endpoint.url}/rest/${endpoint.user}/layers`;
      url = HsUtilsService.proxify(url);
      endpoint.datasourcePaging.loaded = false;
      if (endpoint.canceler !== undefined) {
        endpoint.canceler.resolve();
        delete endpoint.canceler;
      }
      endpoint.canceler = $q.defer();
      $http
        .get(url, {
          timeout: endpoint.canceler.promise,
          dataset: endpoint,
        })
        .then(me.datasetsReceived, (e) => {
          endpoint.datasourcePaging.loaded = true;
        });
    },

    /**
     * @private
     * @function datasetsReceived
     * @param {object} j HTTP response containing all the layers
     * @description (PRIVATE) Callback for catalogue http query
     */
    datasetsReceived(j) {
      const dataset = j.config.dataset;
      dataset.loading = false;
      dataset.layers = [];
      dataset.datasourcePaging.loaded = true;
      if (j.data === null) {
        dataset.datasourcePaging.matched == 0;
      } else {
        j = j.data;
        dataset.datasourcePaging.matched = j.length;
        for (const lyr in j) {
          if (j[lyr]) {
            const obj = {
              title: j[lyr].name,
              type: ['WMS', 'WFS'],
              name: j[lyr].name,
            };
            dataset.layers.push(obj);
          }
        }
      }
    },

    /**
     * @function fillLayerMetadata
     * @param {object} dataset Configuration of selected datasource (from app config)
     * @param {object} layer Layman layer for which to get metadata
     * @returns {Promise} Promise which is resolved when layer metadata is filled
     * @description Fills metadata about layer, because layman layer list API provides
     * just name and uuid
     */
    fillLayerMetadata(dataset, layer) {
      let url = `${dataset.url}/rest/${dataset.user}/layers/${layer.name}`;
      url = HsUtilsService.proxify(url);
      return new Promise((resolve, reject) => {
        $http
          .get(url, {
            timeout: dataset.canceler.promise,
            dataset,
          })
          .then((j) => {
            layer = {...layer, ...j.data};
            if (layer.thumbnail) {
              layer.thumbnail = dataset.url + layer.thumbnail.url;
            }
            resolve();
          })
          .catch((e) => {
            reject(e);
          });
      });
    },

    /**
     * @function describeWhatToAdd
     * @param {Object} ds Configuration of selected datasource (from app config)
     * @param {Object} layer Layman layer for which to get metadata
     * @returns {Promise}
     * @description Gets layer metadata and returns promise which describes layer
     * in a common format for use in add-layers component
     */
    describeWhatToAdd(ds, layer) {
      return new Promise((resolve, reject) => {
        me.fillLayerMetadata(ds, layer).then(() => {
          resolve({
            type: layer.type,
            link: layer.wms.url,
            layer: layer.name,
            title: layer.name,
          });
        });
      });
    },
  });
  return me;
}
