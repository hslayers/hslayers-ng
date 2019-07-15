import 'angular';
import { Vector } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import SparqlJson from 'hs.source.SparqlJson'
import social from 'angular-socialshare';
import './config-parsers.module';
import { transform, transformExtent } from 'ol/proj';
import { fromExtent as polygonFromExtent } from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import { Style, Icon, Stroke, Fill, Circle } from 'ol/style';

export default ['$rootScope', '$q', '$location', '$http', 'hs.map.service', 'Core', 'hs.compositions.service_parser', 'config', 'hs.permalink.urlService', '$compile', '$cookies', 'hs.utils.service', 'hs.save-map.service',
    function ($rootScope, $q, $location, $http, OlMap, Core, compositionParser, config, permalink, $compile, $cookies, utils, statusCreator) {
        var me = this;

        me.data = {};

        me.data.start = 0;
        me.data.limit = 20;
        me.data.next = 20;
        me.data.useCallbackForEdit = false;

        me.compositionsLoaded = false;

        var extentLayer;

        function getCompositionsQueryUrl(params, bbox) {
            var query = params.query;
            var bboxDelimiter = config.compositions_catalogue_url.indexOf('cswClientRun.php') > 0 ? ',' : ' ';
            var serviceName = angular.isDefined(config.compositions_catalogue) && angular.isDefined(config.compositions_catalogue.serviceName) ? 'serviceName=&' + config.compositions_catalogue.serviceName : '';
            bbox = (params.filterExtent ? encodeURIComponent(" and BBOX='" + bbox.join(bboxDelimiter) + "'") : '');
            var catalogueKnown = false;
            var textFilter = query && angular.isDefined(query.title) && query.title != '' ? encodeURIComponent(" AND title like '*" + query.title + "*' OR abstract like '*" + query.title + "*'") : '';
            var selected = [];
            var keywordFilter = "";
            var tmp = '';
            angular.forEach(params.keywords, function (value, key) {
                if (value) selected.push("subject='" + key + "'");
            });
            if (selected.length > 0)
                keywordFilter = encodeURIComponent(' AND (' + selected.join(' OR ') + ')');

            if (angular.isDefined(config.hostname)) {
                if (config.hostname.user && config.hostname.user.url) {
                    tmp = config.hostname.user.url;
                } else if (config.hostname.compositions_catalogue) {
                    tmp = config.hostname.compositions_catalogue.url
                    catalogueKnown = true;
                } else if (config.hostname && config.hostname.default) {
                    tmp = config.hostname.default.url
                }
            }

            if (!catalogueKnown) {
                if (tmp.indexOf('http') > -1) {
                    //Remove domain from url
                    tmp += config.compositions_catalogue_url.replace(/^.*\/\/[^\/]+/, '');
                } else {
                    tmp += config.compositions_catalogue_url
                }
            }
            tmp += "?format=json&" + serviceName + "query=type%3Dapplication" + bbox + textFilter + keywordFilter + "&lang=eng&sortBy=" + params.sortBy + "&detail=summary&start=" + params.start + "&limit=" + params.limit;
            tmp = utils.proxify(tmp);
            return tmp;
        }

        me.loadCompositions = function (params) {
            me.compositionsLoaded = false;
            if (angular.isUndefined(params.sortBy)) params.sortBy = 'bbox';
            if (angular.isUndefined(params.start)) params.start = me.data.start;
            if (angular.isUndefined(params.limit) || isNaN(params.limit)) params.limit = me.data.limit;
            var mapSize = OlMap.map.getSize();
            var mapExtent = angular.isDefined(mapSize) ? OlMap.map.getView().calculateExtent(mapSize) : [0, 0, 100, 100];
            var bbox = transformExtent(mapExtent, OlMap.map.getView().getProjection(), 'EPSG:4326');

            if (angular.isDefined(config.compositions_catalogue_url)) {
                extentLayer.getSource().clear();
                if (angular.isDefined(me.canceler)) {
                    me.canceler.resolve();
                    delete me.canceler;
                }
                me.canceler = $q.defer();
                $http.get(getCompositionsQueryUrl(params, bbox), { timeout: me.canceler.promise }).then(
                    function (response) {
                        me.compositionsLoaded = true;
                        response = response.data;
                        me.data.compositions = response.records;
                        if (response.records && response.records.length > 0) {
                            me.data.compositionsCount = response.matched;
                        } else {
                            me.data.compositionsCount = 0;
                        }
                        //TODO: Needs refactoring
                        me.data.next = response.next;
                        angular.forEach(me.data.compositions, function (record) {
                            var attributes = {
                                record: record,
                                hs_notqueryable: true,
                                highlighted: false
                            };
                            record.editable = false;
                            if (angular.isUndefined(record.thumbnail)) {
                                record.thumbnail = statusCreator.endpointUrl() + '?request=loadthumb&id=' + record.id;
                            }
                            var extent = compositionParser.parseExtent(record.bbox);
                            //Check if height or Width covers the whole screen
                            if (!((extent[0] < mapExtent[0] && extent[2] > mapExtent[2]) || (extent[1] < mapExtent[1] && extent[3] > mapExtent[3]))) {
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
                        me.loadStatusManagerCompositions(params, bbox);
                    }, function (err) { }
                );
            } else {
                me.loadStatusManagerCompositions(params, bbox);
            }
        }

        /**
         * @ngdoc method
         * @name hs.compositions.service#loadStatusManagerCompositions
         * @public
         * @description Load list of compositions according to current filter values and pager position (filter, keywords, current extent, start composition, compositions number per page). Display compositions extent in map
         */
        me.loadStatusManagerCompositions = function (params, bbox) {
            var url = statusCreator.endpointUrl();
            var query = params.query;
            var textFilter = query && angular.isDefined(query.title) && query.title != '' ? '&q=' + encodeURIComponent('*' + query.title + '*') : '';
            url += '?request=list&project=' + encodeURIComponent(config.project_name) + '&extent=' + bbox.join(',') + textFilter + '&start=0&limit=1000&sort=' + getStatusSortAttr(params.sortBy);
            url = utils.proxify(url);
            me.canceler.resolve();
            $http.get(url, { timeout: me.canceler.promise }).then(function (response) {
                response = response.data;
                if (angular.isUndefined(me.data.compositions)) {
                    me.data.compositions = [];
                    me.data.compositionsCount = 0;
                }
                angular.forEach(response.results, function (record) {
                    var found = false;
                    angular.forEach(me.data.compositions, function (composition) {
                        if (composition.id == record.id) {
                            if (angular.isDefined(record.edit)) composition.editable = record.edit;
                            found = true;
                        }
                    })
                    if (!found) {
                        record.editable = false;
                        if (angular.isDefined(record.edit)) record.editable = record.edit;
                        if (angular.isUndefined(record.link)) {
                            record.link = statusCreator.endpointUrl() + '?request=load&id=' + record.id;
                        }
                        if (angular.isUndefined(record.thumbnail)) {
                            record.thumbnail = statusCreator.endpointUrl() + '?request=loadthumb&id=' + record.id;
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
                            me.data.compositions.push(record);
                            me.data.compositionsCount = me.data.compositionsCount + 1;
                        }
                    }
                });
            }, function (err) {

            })
        }

        me.resetCompositionCounter = function () {
            me.data.start = 0;
            me.data.next = me.data.limit;
        }

        me.deleteComposition = function (composition) {
            var url = statusCreator.endpointUrl() + '?request=delete&id=' + composition.id + '&project=' + encodeURIComponent(config.project_name);
            url = utils.proxify(url);
            $http({ url: url }).
                then(function (response) {
                    $rootScope.$broadcast('compositions.composition_deleted', composition.id);
                    me.loadCompositions();
                }, function (err) {

                });
        }

        me.highlightComposition = function (composition, state) {
            if (angular.isDefined(composition.feature))
                composition.feature.set('highlighted', state)
        }

        function getStatusSortAttr(sortBy) {
            var sortMap = {
                bbox: '[{"property":"bbox","direction":"ASC"}]',
                title: '[{"property":"title","direction":"ASC"}]',
                date: '[{"property":"date","direction":"ASC"}]'
            };
            return encodeURIComponent(sortMap[sortBy]);
        }

        function callbackForEdit() {
            Core.openStatusCreator();
        }

        function init() {
            extentLayer = new VectorLayer({
                title: "Composition extents",
                show_in_manager: false,
                source: new Vector(),
                removable: false,
                style: function (feature, resolution) {
                    return [new Style({
                        stroke: new Stroke({
                            color: '#005CB6',
                            width: feature.get('highlighted') ? 4 : 1
                        }),
                        fill: new Fill({
                            color: 'rgba(0, 0, 255, 0.01)'
                        })
                    })]
                }
            });

            OlMap.map.on('pointermove', function (evt) {
                var features = extentLayer.getSource().getFeaturesAtCoordinate(evt.coordinate);
                var somethingDone = false;
                angular.forEach(extentLayer.getSource().getFeatures(), function (feature) {
                    if (feature.get("record").highlighted) {
                        feature.get("record").highlighted = false;
                        somethingDone = true;
                    }
                });
                if (features.length) {
                    angular.forEach(features, function (feature) {
                        if (!feature.get("record").highlighted) {
                            feature.get("record").highlighted = true;
                            somethingDone = true;
                        }
                    })
                }
                if (somethingDone && !$rootScope.$$phase) $rootScope.$digest();
            });

            if (angular.isDefined($cookies.get('hs_layers')) && window.permalinkApp != true) {
                var data = $cookies.get('hs_layers');
                var layers = compositionParser.jsonToLayers(JSON.parse(data));
                for (var i = 0; i < layers.length; i++) {
                    OlMap.addLayer(layers[i]);
                }
                $cookies.remove('hs_layers');
            }

            OlMap.map.addLayer(extentLayer);

            if (permalink.getParamValue('composition')) {
                var id = permalink.getParamValue('composition');
                if (id.indexOf('http') == -1 && id.indexOf(config.status_manager_url) == -1)
                    id = statusCreator.endpointUrl() + '?request=load&id=' + id;
                compositionParser.load(id);
            }
        }

        if (angular.isDefined(OlMap.map)) init()
        else $rootScope.$on('map.loaded', function () { init(); });

        $rootScope.$on('compositions.composition_edited', function (event) {
            compositionParser.composition_edited = true;
        });

        $rootScope.$on('compositions.load_composition', function (event, id) {
            id = statusCreator.endpointUrl() + '?request=load&id=' + id;
            compositionParser.load(id);
        });

        $rootScope.$on('infopanel.feature_selected', function (event, feature, selector) {
            if (angular.isDefined(feature.get("is_hs_composition_extent")) && angular.isDefined(feature.get("record"))) {
                var record = feature.get("record");
                me.data.useCallbackForEdit = false;
                feature.set('highlighted', false);
                selector.getFeatures().clear();
                me.loadComposition(record);
            }
        });

        me.shareComposition = function (record) {
            var compositionUrl = (Core.isMobile() && config.permalinkLocation ? (config.permalinkLocation.origin + config.permalinkLocation.pathname) : ($location.protocol() + "://" + location.host + location.pathname)) + "?composition=" + encodeURIComponent(record.link);
            var shareId = utils.generateUuid();
            var metadata = {};
            $http({
                method: 'POST',
                url: statusCreator.endpointUrl(),
                data: JSON.stringify({
                    request: 'socialShare',
                    id: shareId,
                    url: encodeURIComponent(compositionUrl),
                    title: record.title,
                    description: record.abstract,
                    image: record.thumbnail || 'https://ng.hslayers.org/img/logo.jpg'
                })
            }).then(function (response) {
                utils.shortUrl(statusCreator.endpointUrl() + "?request=socialshare&id=" + shareId)
                    .then(function (shortUrl) {
                        me.data.shareUrl = shortUrl;
                    }).catch(function () {
                        console.log('Error creating short Url');
                    })
                me.data.shareTitle = record.title;
                if (config.social_hashtag && me.data.shareTitle.indexOf(config.social_hashtag) <= 0) me.data.shareTitle += ' ' + config.social_hashtag;

                me.data.shareDescription = record.abstract;
                if (!$rootScope.$$phase) $rootScope.$digest();
                $rootScope.$broadcast('composition.shareCreated', me.data);
            }, function (err) { });
        }

        me.getCompositionInfo = function (composition, cb) {
            compositionParser.loadInfo(composition.link, function (info) {
                me.data.info = info;
                me.data.info.thumbnail = composition.thumbnail;
                cb(me.data.info)
            });
        }

        me.loadCompositionParser = function (record) {
            var url = record.link;
            var title = record.title;
            if (compositionParser.composition_edited == true) {
                $rootScope.$broadcast('loadComposition.notSaved', record);

            } else {
                me.loadComposition(url, true);
            }
        }

        me.loadComposition = function (url, overwrite) {
            compositionParser.load(url, overwrite, me.data.useCallbackForEdit ? callbackForEdit : null);
        }

        $rootScope.$on('core.map_reset', function (event, data) {
            compositionParser.composition_loaded = null;
            compositionParser.composition_edited = false;
        });

        $rootScope.$on('core.mainpanel_changed', function (event) {
            if (angular.isDefined(extentLayer)) {
                if (Core.mainpanel === 'composition_browser' || Core.mainpanel === 'composition') {
                    extentLayer.setVisible(true);
                }
                else extentLayer.setVisible(false);
            }
        });

        return me;
    }]
