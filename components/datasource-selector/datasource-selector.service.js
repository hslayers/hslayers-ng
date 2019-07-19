import { Style, Icon, Stroke, Fill, Circle } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import { Vector } from 'ol/source';
import { transform, transformExtent } from 'ol/proj';
import Feature from 'ol/Feature';
import { fromExtent as polygonFromExtent } from 'ol/geom/Polygon';

export default ['$rootScope', 'hs.map.service', 'Core', 'config', '$http', '$q', 'hs.utils.service', 'hs.addLayersVector.service',
    function ($rootScope, OlMap, Core, config, $http, $q, utils, nonwmsservice) {
        var me = this;

        this.data = {};

        this.data.query = {
            textFilter: '',
            title: '',
            type: 'service',
            Subject: ''
        };

        this.data.paging = config.dsPaging || 10;
        this.data.textField = 'AnyText';
        this.data.selectedLayer = null;
        this.data.filterByExtent = true;
        this.data.datasets = undefined;
        this.data.mickaDS = undefined;
        this.data.suggestionConfig = {};
        this.data.suggestions = [];
        this.data.suggestionsLoaded = true;
        this.data.datasources = config.datasources || [];

        var extentLayer = new VectorLayer({
            title: "Datasources extents",
            show_in_manager: false,
            source: new Vector(),
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

        /**
        * @function loadDatasets
        * @memberOf hs.datasource_selector.service
        * @param {Object} datasets List of datasources for datasets load
        * Get datasources and loads datasets for each (uses doadDataset)
        */
        this.loadDatasets = function (datasets) {
            me.data.datasets = datasets;
            extentLayer.getSource().clear();
            for (var ds in me.data.datasets) {
                me.data.datasets[ds].start = 0;
                me.loadDataset(me.data.datasets[ds]);
            }
        }

        /**
        * @function loadDataset
        * @memberOf hs.datasource_selector.service
        * @param {Object} ds Configuration of selected datasource (from app config)
        * Loads datasets metadata from selected source (CSW server). Currently supports only "Micka" type of source. Use all query params (search text, bbox, params.., sorting, paging, start) 
        */
        this.loadDataset = function (dataset) {
            switch (dataset.type) {
                case "micka":
                    var b = transformExtent(OlMap.map.getView().calculateExtent(OlMap.map.getSize()), OlMap.map.getView().getProjection(), 'EPSG:4326');
                    var bbox = me.data.filterByExtent ? "BBOX='" + b.join(' ') + "'" : '';
                    var ue = encodeURIComponent;
                    var text = angular.isDefined(me.data.query.textFilter) && me.data.query.textFilter.length > 0 ? me.data.query.textFilter : me.data.query.title;
                    var query = [
                        (text != '' ? me.data.textField + ue(" like '*" + text + "*'") : ''),
                        ue(bbox),
                        //param2Query('type'),
                        param2Query('ServiceType'),
                        param2Query('topicCategory'),
                        param2Query('Subject'),
                        param2Query('Denominator'),
                        param2Query('OrganisationName'),
                        param2Query('keywords')
                    ].filter(function (n) {
                        return n != ''
                    }).join('%20AND%20');
                    var url = dataset.url + '?request=GetRecords&format=application/json&language=' + dataset.language + '&query=' + query + (typeof me.data.query.sortby != 'undefined' && me.data.query.sortby != '' ? '&sortby=' + me.data.query.sortby : '&sortby=bbox') + '&limit=' + me.data.paging + '&start=' + dataset.start;
                    url = utils.proxify(url);
                    dataset.loaded = false;
                    if (angular.isDefined(dataset.canceler)) {
                        dataset.canceler.resolve();
                        delete dataset.canceler;
                    }
                    dataset.canceler = $q.defer();
                    $http.get(url, { timeout: dataset.canceler.promise }).then(
                        function (j) {
                            dataset.loading = false;
                            angular.forEach(dataset.layers, function (val) {
                                try {
                                    if (typeof val.feature !== 'undefined' && val.feature != null)
                                        extentLayer.getSource().removeFeature(val.feature);
                                } catch (ex) { }
                            })
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
                                        addExtentFeature(obj);
                                    }
                                }
                            }
                        }, function (e) {
                            dataset.loaded = true;
                        });
                    break;
            }
        }

        /**
        * @function fillCodesets
        * @memberOf hs.datasource_selector.service
        * @param {Object} datasets Input datasources
        * Download codelists for all "micka" type datasources from Url specified in app config.
        */
        this.fillCodesets = function (datasets) {
            for (var ds in datasets) {
                me.fillCodeset(me.data.datasets[ds]);
            }
        }

        /**
        * @function fillCodeset
        * @memberOf hs.datasource_selector.service
        * @param {Object} ds Single datasource
        * Download code-list for micka type source from Url specifiead in app config.
        */
        this.fillCodeset = function (ds) {
            switch (ds.type) {
                case "micka":
                    var url = ds.code_list_url;
                    url = utils.proxify(url);
                    if (typeof ds.code_lists == 'undefined') {
                        ds.code_lists = {
                            serviceType: [],
                            applicationType: [],
                            dataType: [],
                            topicCategory: []
                        }
                    }
                    if (angular.isDefined(ds.canceler)) {
                        ds.canceler.resolve();
                        delete ds.canceler;
                    }
                    ds.canceler = $q.defer();
                    $http.get(url, { timeout: ds.canceler.promise }).then(
                        function (j) {
                            var oParser = new DOMParser();
                            var oDOM = oParser.parseFromString(j.data, "application/xml");
                            var doc = oDOM.documentElement;
                            doc.querySelectorAll("map serviceType value").forEach(function (type) {
                                ds.code_lists.serviceType.push({
                                    value: type.attributes.name.value,
                                    name: type.innerHTML
                                });
                            });
                            doc.querySelectorAll("map applicationType value").forEach(function (type) {
                                ds.code_lists.applicationType.push({
                                    value: type.attributes.name.value,
                                    name: type.innerHTML
                                });
                            });
                            doc.querySelectorAll("map topicCategory value").forEach(function (type) {
                                ds.code_lists.topicCategory.push({
                                    value: type.attributes.name.value,
                                    name: type.innerHTML
                                });
                            });
                            me.advancedMickaTypeChanged();
                        }, function (err) { }
                    );
                    break;
            }
        }

        /**
        * @function advancedMickaTypeChanged
        * @memberOf hs.datasource_selector.service
        * Sets Micka source level types according to current query type (service/appilication). Deprecated?
        */
        this.advancedMickaTypeChanged = function () {
            if (typeof me.data.mickaDS == 'undefined') return;
            if (typeof me.data.mickaDS.code_lists == 'undefined') return;
            switch (me.data.query.type) {
                case "service":
                    me.data.mickaDS.level2_types = me.data.mickaDS.code_lists.serviceType;
                    break;
                case "application":
                    me.data.mickaDS.level2_types = me.data.mickaDS.code_lists.applicationType;
                    break;
            }
        }

        this.checkAdvancedMicka = function () {
            if (angular.isUndefined(me.data.mickaDS)) {
                for (var ds in me.data.datasets) {
                    if (me.data.datasets[ds].type == 'micka') {
                        me.data.mickaDS = me.data.datasets[ds];
                    }
                }
            }
            if (me.data.query.title != '') me.data.query.textFilter = me.data.query.title;
        }

        this.changeSuggestionConfig = function (input, param, field) {
            me.data.suggestionConfig = {
                input: input,
                param: param,
                field: field
            };
        }

        /**
        * @function suggestionFilterChanged
        * @memberOf hs.datasource_selector.service
        * Send suggestion request to Micka CSW server and parse response
        */
        this.suggestionFilterChanged = function () {
            if (typeof me.suggestionAjax != 'undefined') me.suggestionAjax.abort();
            var url = me.data.mickaDS.url + '../util/suggest.php?&type=' + me.data.suggestionConfig.param + '&query=' + me.data.suggestionFilter;
            url = utils.proxify(url);
            me.data.suggestionsLoaded = false;
            me.suggestionAjax = $.ajax({
                url: url,
                cache: false,
                dataType: "json",
                success: function (j) {
                    me.data.suggestionsLoaded = true;
                    me.data.suggestions = j.records;
                    delete me.suggestionAjax;
                    if (!$rootScope.$$phase) $rootScope.$digest();
                }
            });
        }

        /**
        * @function addSuggestion
        * @memberOf hs.datasource_selector.service
        * @param {String} text Selected property value from suggestions
        * Save suggestion into Query object
        */
        this.addSuggestion = function (text) {
            me.data.query[me.data.suggestionConfig.input] = text;
        }

        /**
        * @function param2Query
        * @memberOf hs.datasource_selector.service
        * @param {String} which Parameter name to parse
        * (PRIVATE) Parse query parameter into encoded key value pair. 
        */
        function param2Query(which) {
            if (typeof me.data.query[which] != 'undefined') {
                if (which == 'type' && me.data.query[which] == 'data') {
                    //Special case for type 'data' because it can contain many things
                    return encodeURIComponent("(type='dataset' OR type='nonGeographicDataset' OR type='series' OR type='tile')");
                }
                return (me.data.query[which] != '' ? encodeURIComponent(which + "='" + me.data.query[which] + "'") : '')
            } else {
                if (which == 'ServiceType') {
                    return encodeURIComponent("(ServiceType=view OR ServiceType=download OR ServiceType=WMS OR ServiceType=WFS OR Format like '*KML*' OR Format like '*GeoJSON*' OR Format like '*application/sparql-results+json*')");
                } else {
                    return '';
                }
            }
        }

        /**
         * @function isZoomable
         * @memberOf hs.datasource_selector.service
         * @param {unknown} selected_layer TODO
         * Test if it possible to zoom to layer overview (bbox has to be defined in metadata of selected layer)
         */
        this.isZoomable = function (layer) {
            return angular.isDefined(layer.bbox);
        }

        /**
         * @function zoomTo
         * @memberOf hs.datasource_selector
         * @param {String} bbox Bounding box of selected layer
         * ZoomTo / MoveTo to selected layer overview
         */
        this.zoomTo = function (bbox) {
            if (typeof bbox == 'undefined') return;
            var b = bbox.split(" ");
            var first_pair = [parseFloat(b[0]), parseFloat(b[1])];
            var second_pair = [parseFloat(b[2]), parseFloat(b[3])];
            first_pair = transform(first_pair, 'EPSG:4326', OlMap.map.getView().getProjection());
            second_pair = transform(second_pair, 'EPSG:4326', OlMap.map.getView().getProjection());
            if (isNaN(first_pair[0]) || isNaN(first_pair[1]) || isNaN(second_pair[0]) || isNaN(second_pair[1])) return;
            var extent = [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
            OlMap.map.getView().fit(extent, OlMap.map.getSize());
        }

        /**
         * @function addExtentFeature
         * @memberOf hs.datasource_selector
         * @param {Object} record Record of one dataset from Get Records response
         * (PRIVATE) Create extent features for displaying extent of loaded dataset records in map
         */
        function addExtentFeature(record) {
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
            extentLayer.getSource().addFeatures([new_feature]);
        }

        /**
         * @function layerDownload
         * @memberOf hs.datasource_selector
         * @param {Object} ds Datasource of selected layer
         * @param {Object} layer Metadata record of selected layer
         * @returns {String} Download url of layer if possible 
         * Test if layer of selected record is downloadable (KML and JSON files, with direct url) and gives Url.
         */
        this.layerDownload = function (ds, layer) {
            if (ds.download == true) {
                if (["kml", "geojson", "json"].indexOf(layer.formats[0].toLowerCase()) > -1 && layer.url.length > 0) {
                    return layer.url
                }
            }
            return "#"
        }

        /**
         * @function layerRDF
         * @memberOf hs.datasource_selector
         * @param {Object} ds Datasource of selected layer
         * @param {Object} layer Metadata record of selected layer
         * @returns {String} URL to record file
         * Get URL for RDF-DCAT record of selected layer
         */
        this.layerRDF = function (ds, layer) {
            return ds.url + "?request=GetRecordById&id=" + layer.id + "&outputschema=http://www.w3.org/ns/dcat%23";
        }

        /**
         * @function addLayerToMap
         * @memberOf hs.datasource_selector
         * @param {Object} ds Datasource of selected layer
         * @param {Object} layer Metadata record of selected layer
         * Add selected layer to map (into layer manager) if possible (supported formats: WMS, WFS, Sparql, kml, geojson, json)
         */
        this.addLayerToMap = function (ds, layer) {
            if (ds.type == "micka") {
                if (layer.trida == 'service') {
                    if (layer.serviceType == 'WMS' || layer.serviceType == 'OGC:WMS' || layer.serviceType == 'view') {
                        return "WMS";
                    } else if ((layer.link.toLowerCase()).indexOf("sparql") > -1) {
                        var lyr = nonwmsservice.add('sparql', layer.link, layer.title || 'Layer', layer.abstract, true, 'EPSG:4326');
                    } else if (layer.serviceType == 'WFS' || layer.serviceType == 'OGC:WFS' || layer.serviceType == 'download') {
                        return "WFS";
                    } else if (layer.formats && ["kml", "geojson", "json"].indexOf(layer.formats[0].toLowerCase()) > -1) {
                        switch (layer.formats[0].toLowerCase()) {
                            case "kml":
                                var lyr = nonwmsservice.add('kml', layer.link, layer.title || 'Layer', layer.abstract, true, 'EPSG:4326');
                                break;
                            case "json":
                            case "geojson":
                                var lyr = nonwmsservice.add('geojson', layer.link, layer.title || 'Layer', layer.abstract, false, 'EPSG:4326');
                                break;
                        }

                        return;
                    } else {
                        alert('Service type "' + layer.serviceType + '" not supported.');
                    }
                } else if (layer.trida == 'dataset') {
                    if (["kml", "geojson", "json"].indexOf(layer.formats[0].toLowerCase()) > -1) {
                        switch (layer.formats[0].toLowerCase()) {
                            case "kml":
                                var lyr = nonwmsservice.add('kml', layer.link, layer.title || 'Layer', layer.abstract, true, 'EPSG:4326');
                                break;
                            case "json":
                            case "geojson":
                                var lyr = nonwmsservice.add('geojson', layer.link, layer.title || 'Layer', layer.abstract, false, 'EPSG:4326');
                                break;
                        }

                        return;
                    }
                } else {
                    alert('Datasource type "' + layer.trida + '" not supported.');
                }
            }
        }

        /**
         * @function highlightComposition
         * @memberOf hs.datasource_selector.service
         * @param {unknown} composition
         * @param {Boolean} state Desired visual state of composition (True = highlighted, False = normal)
         * Change visual apperance of composition overview in map between highlighted and normal
         */
        this.highlightComposition = function (composition, state) {
            if (typeof composition.feature !== 'undefined')
                composition.feature.set('highlighted', state);
        }

        /**
         * @function clear
         * @memberOf hs.datasource_selector.service
         * Clear query variable
         */
        this.clear = function () {
            me.data.query.textFilter = "";
            me.data.query.title = "";
            me.data.query.Subject = "";
            me.data.query.keywords = "";
            me.data.query.OrganisationName = "";
            me.data.query.sortby = "";
        }

        function dataSourceExistsAndEmpty() {
            return me.data.datasources.length > 0 && angular.isUndefined(me.data.datasources[0].loaded)
        }

        function panelVisible() {
            return Core.panelVisible('datasource_selector') || Core.panelVisible('datasourceBrowser')
        }

        function init() {
            OlMap.map.on('pointermove', function (evt) {
                var features = extentLayer.getSource().getFeaturesAtCoordinate(evt.coordinate);
                var something_done = false;
                angular.forEach(extentLayer.getSource().getFeatures(), function (feature) {
                    if (feature.get("record").highlighted) {
                        feature.get("record").highlighted = false;
                        something_done = true;
                    }
                });
                if (features.length) {
                    angular.forEach(features, function (feature) {
                        if (!feature.get("record").highlighted) {
                            feature.get("record").highlighted = true;
                            something_done = true;
                        }
                    })
                }
                if (something_done && !$rootScope.$$phase) $rootScope.$digest();
            });
            $rootScope.$on('map.extent_changed', function (e) {
                if (!panelVisible()) return;
                if (me.data.filterByExtent) me.loadDatasets(me.data.datasources);
            });
            OlMap.map.addLayer(extentLayer);
            if (dataSourceExistsAndEmpty() && panelVisible()) {
                me.loadDatasets(me.data.datasources);
                me.fillCodesets(me.data.datasources);
            }
            $rootScope.$on('core.mainpanel_changed', function (event) {
                if (dataSourceExistsAndEmpty() && panelVisible()) {
                    me.loadDatasets(me.data.datasources);
                    me.fillCodesets(me.data.datasources);
                }
                extentLayer.setVisible(panelVisible());
            });
        }

        if (angular.isDefined(OlMap.map))
            init()
        else
            $rootScope.$on('map.loaded', function () {
                init();
            });

        return me;
    }]