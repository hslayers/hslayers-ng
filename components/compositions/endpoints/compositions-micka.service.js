import { fromExtent as polygonFromExtent } from 'ol/geom/Polygon';
import Feature from 'ol/Feature';

export default ['$rootScope', 'hs.compositions.service_parser', 'config', 
    '$q', '$http', 'hs.map.service', 'hs.utils.service',
    function ($rootScope, compositionParser, config, $q, $http, hsMap, utils) {
        var me = this;
        angular.extend(me, {
            data: {
                limit: 15
            },
            getCompositionsQueryUrl(ds, params, bbox) {
                var query = params.query;
                var bboxDelimiter = ds.url.indexOf('cswClientRun.php') > 0 ? ',' : ' ';
                var serviceName = angular.isDefined(ds.serviceName) ? 'serviceName=&' + ds.serviceName : '';
                bbox = (params.filterExtent ? encodeURIComponent(" and BBOX='" + bbox.join(bboxDelimiter) + "'") : '');
                var textFilter = query && angular.isDefined(query.title) && query.title != '' ? encodeURIComponent(" AND title like '*" + query.title + "*' OR abstract like '*" + query.title + "*'") : '';
                var selected = [];
                var keywordFilter = "";
                var tmp = ds.url;
                angular.forEach(params.keywords, function (value, key) {
                    if (value) selected.push("subject='" + key + "'");
                });
                if (selected.length > 0)
                    keywordFilter = encodeURIComponent(' AND (' + selected.join(' OR ') + ')');

                tmp += "?format=json&" + serviceName + "query=type%3Dapplication" + bbox + textFilter + keywordFilter + "&lang=eng&sortBy=" + params.sortBy + "&detail=summary&start=" + params.start + "&limit=" + params.limit;
                tmp = utils.proxify(tmp);
                return tmp;
            },

            loadList(ds, params, bbox, extentLayer) {
                ds.loaded = false;
                if (angular.isUndefined(params.sortBy)) params.sortBy = 'bbox';
                if (angular.isUndefined(params.start)) params.start = ds.start;
                if (angular.isUndefined(params.limit) || isNaN(params.limit)) params.limit = me.data.limit;
                return new Promise((resolve, reject) => {
                    if (angular.isDefined(me.canceler)) {
                        me.canceler.resolve();
                        delete me.canceler;
                    }
                    me.canceler = $q.defer();
                    $http.get(me.getCompositionsQueryUrl(ds, params, bbox),
                        { timeout: me.canceler.promise }).then((response) => {
                            ds.loaded = true;
                            response = response.data;
                            ds.compositions = response.records;
                            if (response.records && response.records.length > 0) {
                                ds.compositionsCount = response.matched;
                            } else {
                                ds.compositionsCount = 0;
                            }
                            //TODO: Needs refactoring
                            ds.next = response.next;
                            var mapExtent = hsMap.getMapExtent();
                            angular.forEach(ds.compositions, function (record) {
                                var attributes = {
                                    record: record,
                                    hs_notqueryable: true,
                                    highlighted: false
                                };
                                record.editable = false;
                                record.endpoint = ds;
                                if (angular.isUndefined(record.thumbnail)) {
                                    record.thumbnail = ds.url + '?request=loadthumb&id=' + record.id;
                                }
                                var extent = compositionParser.parseExtent(record.bbox);
                                //Check if height or Width covers the whole screen
                                if (!((extent[0] < mapExtent[0] && extent[2] > mapExtent[2])
                                    || (extent[1] < mapExtent[1] && extent[3] > mapExtent[3]))) {
                                    attributes.geometry = polygonFromExtent(extent);
                                    attributes.is_hs_composition_extent = true;
                                    var newFeature = new Feature(attributes);
                                    record.feature = newFeature;
                                    extentLayer.getSource().addFeatures([newFeature]);
                                } else {
                                    //Composition not in extent
                                }
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

