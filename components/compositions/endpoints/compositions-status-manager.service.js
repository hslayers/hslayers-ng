import { fromExtent as polygonFromExtent } from 'ol/geom/Polygon';
import Feature from 'ol/Feature';

export default ['hs.statusManagerService', 'config', 'hs.utils.service', '$q', '$http',
    function (statusManagerService, config, utils, $q, $http) {
        var me = this;
        angular.extend(me, {
            /**
             * @ngdoc method
             * @name hs.compositions.service#loadList
             * @public
             * @description Load list of compositions according to current 
             * filter values and pager position (filter, keywords, current 
             * extent, start composition, compositions number per page). 
             * Display compositions extent in map. Loops through the existing 
             * list of compositions, and when a composition is 
             * found in statusmanagers list, then it becomes editable.
             */
            loadList(ds, params, bbox) {
                var url = statusManagerService.endpointUrl();
                var query = params.query;
                var textFilter = query && angular.isDefined(query.title) && query.title != '' ? '&q=' + encodeURIComponent('*' + query.title + '*') : '';
                url += '?request=list&project=' + encodeURIComponent(config.project_name) + '&extent=' + bbox.join(',') + textFilter + '&start=0&limit=1000&sort=' + getStatusSortAttr(params.sortBy);
                url = utils.proxify(url);
                if (angular.isDefined(me.canceler)) {
                    me.canceler.resolve();
                    delete me.canceler;
                }
                me.canceler = $q.defer();
                $http.get(url, { timeout: me.canceler.promise }).then(function (response) {
                    response = response.data;
                    if (angular.isUndefined(ds.compositions)) {
                        ds.compositions = [];
                        ds.compositionsCount = 0;
                    }
                    angular.forEach(response.results, function (record) {
                        var found = false;
                        angular.forEach(ds.compositions, function (composition) {
                            if (composition.id == record.id) {
                                if (angular.isDefined(record.edit)) composition.editable = record.edit;
                                found = true;
                            }
                        })
                        if (!found) {
                            record.editable = false;
                            if (angular.isDefined(record.edit)) record.editable = record.edit;
                            if (angular.isUndefined(record.link)) {
                                record.link = statusManagerService.endpointUrl() + '?request=load&id=' + record.id;
                            }
                            if (angular.isUndefined(record.thumbnail)) {
                                record.thumbnail = statusManagerService.endpointUrl() + '?request=loadthumb&id=' + record.id;
                            }
                            var attributes = {
                                record: record,
                                hs_notqueryable: true,
                                highlighted: false
                            }
                            attributes.geometry = polygonFromExtent(compositionParser.parseExtent(record.extent));
                            record.feature = new Feature(attributes);
                            extentLayer.getSource().addFeatures([record.feature]);
                            if (record) {
                                ds.compositions.push(record);
                                ds.compositionsCount = ds.compositionsCount + 1;
                            }
                        }
                    });
                }, function (err) {

                })
            }
        })
    }]

function getStatusSortAttr(sortBy) {
    var sortMap = {
        bbox: '[{"property":"bbox","direction":"ASC"}]',
        title: '[{"property":"title","direction":"ASC"}]',
        date: '[{"property":"date","direction":"ASC"}]'
    };
    return encodeURIComponent(sortMap[sortBy]);
}