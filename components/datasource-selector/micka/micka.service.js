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
            * @memberOf hs.mickaBrowserService
            * @param {Object} dataset Configuration of selected datasource (from app config)
            * @param {Object} query Container for all query filter values
            * @param {Number} pageLimit Item count per page
            * @param {Function} extentFeatureCreated Function which gets called 
            * extent feature is created. Has one parameter: feature
            * @description Loads datasets metadata from selected source (CSW server). 
            * Currently supports only "Micka" type of source. 
            * Use all query params (search text, bbox, params.., sorting, paging, start) 
            */
            queryCatalog(dataset, query, pageLimit, extentFeatureCreated) {
                var b = transformExtent(
                    OlMap.map.getView().calculateExtent(OlMap.map.getSize()),
                    OlMap.map.getView().getProjection(),
                    'EPSG:4326'
                );
                var bbox = mickaFilterService.filterByExtent ? "BBOX='" + b.join(' ') + "'" : '';
                var text = angular.isDefined(query.textFilter) &&
                    query.textFilter.length > 0 ? query.textFilter : query.title;
                var query = [
                    (text != '' ? me.data.textField + " like '*" + text + "*'" : ''),
                    bbox,
                    //param2Query('type'),
                    me.param2Query('ServiceType', query),
                    me.param2Query('topicCategory', query),
                    me.param2Query('Subject', query),
                    me.param2Query('Denominator', query),
                    me.param2Query('OrganisationName', query),
                    me.param2Query('keywords', query)
                ].filter(function (n) {
                    return n != ''
                }).join(' AND ');
                var url = dataset.url + '?' + utils.paramsToURL({
                    request: 'GetRecords',
                    format: 'application/json',
                    language: dataset.language,
                    query: query,
                    sortby: (angular.isDefined(query.sortby) && query.sortby != '' ?
                        query.sortby
                        : 'bbox'
                    ),
                    limit: pageLimit,
                    start: dataset.start
                });
                url = utils.proxify(url);
                dataset.loaded = false;
                if (angular.isDefined(dataset.canceler)) {
                    dataset.canceler.resolve();
                    delete dataset.canceler;
                }
                dataset.canceler = $q.defer();
                $http.get(url, {
                    timeout: dataset.canceler.promise,
                    dataset,
                    extentFeatureCreated
                })
                    .then(
                        me.datasetsReceived,
                        function (e) {
                            dataset.loaded = true;
                        });
            },

            /**
            * @function datasetsReceived
            * @memberOf hs.mickaBrowserService
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
                    dataset.matched = j.matched;
                    dataset.next = j.next;
                    for (var lyr in j.records) {
                        if (j.records[lyr]) {
                            var obj = j.records[lyr];
                            dataset.layers.push(obj);
                            if (extentFeatureCreated)
                                extentFeatureCreated(me.addExtentFeature(obj))

                        }
                    }
                }
            },

            /**
            * @function param2Query
            * @memberOf hs.mickaBrowserService
            * @param {String} which Parameter name to parse
            * (PRIVATE) Parse query parameter into encoded key value pair. 
            */
            param2Query(which, query) {
                if (typeof query[which] != 'undefined') {
                    if (which == 'type' && query[which] == 'data') {
                        //Special case for type 'data' because it can contain many things
                        return "(type='dataset' OR type='nonGeographicDataset' OR type='series' OR type='tile')";
                    }
                    return (query[which] != '' ? which + "='" + query[which] + "'" : '')
                } else {
                    if (which == 'ServiceType') {
                        return "(ServiceType=view OR ServiceType=download OR ServiceType=WMS OR ServiceType=WFS)";
                    } else {
                        return '';
                    }
                }
            },

            /**
             * @function addExtentFeature
             * @memberOf hs.mickaBrowserService
             * @param {Object} record Record of one dataset from Get Records response
             * @param {ol/layer/Vector} extentLayer
             * (PRIVATE) Create extent features for displaying extent of loaded dataset records in map
             */
            addExtentFeature(record) {
                var attributes = {
                    record: record,
                    hs_notqueryable: true,
                    highlighted: false
                };
                var b = record.bbox.split(" ");
                var first_pair = [parseFloat(b[0]), parseFloat(b[1])];
                var second_pair = [parseFloat(b[2]), parseFloat(b[3])];
                var mapProjectionExtent = OlMap.map.getView().getProjection().getExtent();
                first_pair = transform(first_pair, 'EPSG:4326', OlMap.map.getView().getProjection());
                second_pair = transform(second_pair, 'EPSG:4326', OlMap.map.getView().getProjection());
                if (!isFinite(first_pair[0])) first_pair[0] = mapProjectionExtent[0];
                if (!isFinite(first_pair[1])) first_pair[1] = mapProjectionExtent[1];
                if (!isFinite(second_pair[0])) second_pair[0] = mapProjectionExtent[2];
                if (!isFinite(second_pair[1])) second_pair[1] = mapProjectionExtent[3];
                if (isNaN(first_pair[0]) || isNaN(first_pair[1]) || isNaN(second_pair[0]) || isNaN(second_pair[1])) return;
                var extent = [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
                attributes.geometry = polygonFromExtent(extent);
                var new_feature = new Feature(attributes);
                record.feature = new_feature;
                return new_feature;
            },

            /**
            * @function describeWhatToAdd
            * @memberOf hs.mickaBrowserService
            * @param {Object} dataset Configuration of selected datasource (from app config)
            * @param {Object} layer Micka service for which to get metadata
            * @description Gets layer metadata and returns promise which describes layer 
            * in a common format for use in add-layers component
            */
            describeWhatToAdd(ds, layer) {
                var whatToAdd = { type: 'none' };
                return new Promise((resolve, reject) => {
                    if (layer.trida == 'service') {
                        if (layer.serviceType == 'WMS' || layer.serviceType == 'OGC:WMS' || layer.serviceType == 'view') {
                            whatToAdd.type = "WMS";
                            whatToAdd.link = layer.link;
                        } else if ((layer.link.toLowerCase()).indexOf("sparql") > -1) {
                            var lyr = nonwmsservice.add('sparql', layer.link, layer.title || 'Layer', layer.abstract, true, 'EPSG:4326');
                        } else if (layer.serviceType == 'WFS' || layer.serviceType == 'OGC:WFS' || layer.serviceType == 'download') {
                            whatToAdd.type = "WFS";
                            whatToAdd.link = layer.link;
                        } else if (layer.formats && ["kml", "geojson", "json"].indexOf(layer.formats[0].toLowerCase()) > -1) {
                            whatToAdd = {
                                type: layer.formats[0].toUpperCase() == 'KML' ? 'kml' : 'geojson',
                                link: layer.link,
                                title: layer.title || 'Layer',
                                abstract: layer.abstract || 'Layer',
                                projection: 'EPSG:4326',
                                extractStyles: layer.formats[0].toLowerCase() == 'kml'
                            }
                        } else {
                            alert('Service type "' + layer.serviceType + '" not supported.');
                            reject();
                            return;
                        }
                    } else if (layer.trida == 'dataset') {
                        if (["kml", "geojson", "json"].indexOf(layer.formats[0].toLowerCase()) > -1) {
                            whatToAdd = {
                                type: layer.formats[0].toUpperCase() == 'KML' ? 'kml' : 'geojson',
                                link: layer.link,
                                title: layer.title || 'Layer',
                                abstract: layer.abstract || 'Layer',
                                projection: 'EPSG:4326',
                                extractStyles: layer.formats[0].toLowerCase() == 'kml'
                            }
                        } else { reject(); return }
                    } else {
                        alert('Datasource type "' + layer.trida + '" not supported.');
                        reject();
                        return;
                    }
                    resolve(whatToAdd)
                }).catch((e) => { reject(e) })
            }
        })
    }
]