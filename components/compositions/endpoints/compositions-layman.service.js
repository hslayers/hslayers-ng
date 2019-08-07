import { fromExtent as polygonFromExtent } from 'ol/geom/Polygon';
import Feature from 'ol/Feature';

export default ['$rootScope', 'hs.compositions.service_parser', 'config', 
    '$q', '$http', 'hs.map.service', 'hs.utils.service',
    function ($rootScope, compositionParser, config, $q, $http, hsMap, utils) {
        var me = this;
        angular.extend(me, {
            data: {
            },
            loadList(ds, params, bbox, extentLayer) {
                ds.loaded = false;
                if (angular.isUndefined(params.sortBy)) params.sortBy = 'bbox';
                return new Promise((resolve, reject) => {
                    if (angular.isDefined(me.canceler)) {
                        me.canceler.resolve();
                        delete me.canceler;
                    }
                    me.canceler = $q.defer();
                    $http.get(`${ds.url}/rest/${ds.user}/maps`,
                        { timeout: me.canceler.promise }).then((response) => {
                            ds.loaded = true;
                            response = response.data;
                            ds.compositions = response;
                            if (response && response.length > 0) {
                                ds.compositionsCount = response.length;
                            } else {
                                ds.compositionsCount = 0;
                            }
                             angular.forEach(ds.compositions, function (record) {
                                record.editable = true;
                                record.endpoint = ds;
                            })
                            $rootScope.$broadcast('CompositionsLoaded');
                            resolve();
                        }, function (err) { }
                        );
                })
            },

            resetCompositionCounter(ds) {
                ds.start = 0;
                ds.next = me.data.limit
            }
        })
    }]

