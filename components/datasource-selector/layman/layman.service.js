import { transform, transformExtent } from 'ol/proj';
import Feature from 'ol/Feature';
import { fromExtent as polygonFromExtent } from 'ol/geom/Polygon';

export default ['hs.map.service', 'Core', 'config', '$http', '$q',
    'hs.utils.service', 'hs.mickaFiltersService',
    function (OlMap, Core, config, $http, $q, utils, mickaFilterService) {
        var me = this;
        angular.extend(me, {
            /**
            * @function queryCatalog
            * @memberOf hs.laymanBrowserService
            * @param {Object} dataset Configuration of selected datasource (from app config)
            * extent feature is created. Has one parameter: feature
            * @description Loads datasets metadata from Layman 
            */
            queryCatalog(dataset) {
                var url = `${dataset.url}/rest/${dataset.user}/layers`
                url = utils.proxify(url);
                dataset.loaded = false;
                if (angular.isDefined(dataset.canceler)) {
                    dataset.canceler.resolve();
                    delete dataset.canceler;
                }
                dataset.canceler = $q.defer();
                $http.get(url, {
                    timeout: dataset.canceler.promise,
                    dataset
                })
                    .then(
                        me.datasetsReceived,
                        function (e) {
                            dataset.loaded = true;
                        });
            },

            /**
            * @function datasetsReceived
            * @memberOf hs.laymanBrowserService
            * @param {Object} j HTTP response containing all the layers
            * (PRIVATE) Callback for catalogue http query
            */
            datasetsReceived(j) {
                var dataset = j.config.dataset;
                var extentFeatureCreated = j.config.extentFeatureCreated;
                dataset.loading = false;
                dataset.layers = [];
                dataset.loaded = true;
                if (j.data == null) {
                    dataset.matched == 0;
                } else {
                    j = j.data;
                    dataset.matched = j.length;
                    for (var lyr in j) {
                        if (j[lyr]) {
                            var obj = {
                                title: j[lyr].name,
                                name: j[lyr].name
                            };
                            dataset.layers.push(obj);
                        }
                    }
                }
            },

            /**
            * @function fillLayerMetadata
            * @memberOf hs.laymanBrowserService
            * @param {Object} dataset Configuration of selected datasource (from app config)
            * @param {Object} layer Layman layer for which to get metadata
            * Fills metadata about layer, because layman layer list API provides
            * just name and uuid
            */
            fillLayerMetadata(dataset, layer) {
                var url = `${dataset.url}/rest/${dataset.user}/layers/${layer.name}`
                url = utils.proxify(url);
                return new Promise((resolve, reject) => {
                    $http.get(url, {
                        timeout: dataset.canceler.promise,
                        dataset
                    }).then((j) => {
                        angular.extend(layer, j.data);
                        if (layer.thumbnail)
                            layer.thumbnail = dataset.url + layer.thumbnail.url;
                        resolve()
                    }).catch((e) => { reject(e) })
                })
            },

            /**
            * @function describeWhatToAdd
            * @memberOf hs.laymanBrowserService
            * @param {Object} dataset Configuration of selected datasource (from app config)
            * @param {Object} layer Layman layer for which to get metadata
            * Gets layer metadata and returns promise which describes layer 
            * in a common format for use in add-layers component
            */
            describeWhatToAdd(ds, layer) {
                return new Promise((resolve, reject) => {
                    me.fillLayerMetadata(ds, layer).then(() => {
                        resolve({
                            type: "WMS",
                            link: layer.wms.url,
                            layer: layer.name
                        })
                    });
                })
            }
        })
    }
]