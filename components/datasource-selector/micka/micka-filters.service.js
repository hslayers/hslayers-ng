export default ['$rootScope', 'hs.map.service', 'Core', 'config', '$http', '$q', 'hs.utils.service',
    function ($rootScope, OlMap, Core, config, $http, $q, utils) {
        var me = this;
        this.suggestionConfig = {};
        this.suggestions = [];
        this.suggestionsLoaded = true;
        this.filterByExtent = true;
        me.otnKeywords = [];

        if (config.datasources && config.datasources.filter(ds => ds.url.indexOf('opentnet.eu') > -1))
            $http({
                method: 'GET',
                url: utils.proxify('http://opentransportnet.eu:8082/api/3/action/vocabulary_show?id=36c07014-c461-4f19-b4dc-a38106144e66')
            }).then(function successCallback(response) {
                me.otnKeywords = [{ title: '-' }];
                angular.forEach(response.data.result.tags, function (tag) {
                    me.otnKeywords.push({ title: tag.name });
                })
            });

        /**
        * @function fillCodesets
        * @memberOf hs.datasourceBrowserService
        * @param {Object} datasets Input datasources
        * Download codelists for all "micka" type datasources from Url specified in app config.
        */
        me.fillCodesets = function (datasets) {
            for (var ds in datasets) {
                me.fillCodeset(datasets[ds]);
            }
        }

        /**
        * @function fillCodeset
        * @memberOf hs.datasourceBrowserService
        * @param {Object} ds Single datasource
        * Download code-list for micka type source from Url specifiead in app config.
        */
        me.fillCodeset = function (ds) {
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
                            me.advancedMickaTypeChanged(ds, 'service');
                        }, function (err) { }
                    );
                    break;
            }
        }

        /**
        * @function advancedMickaTypeChanged
        * @memberOf hs.datasourceBrowserService
        * Sets Micka source level types according to current query type (service/appilication). Deprecated?
        */
        me.advancedMickaTypeChanged = function (mickaDS, type) {
            if (typeof mickaDS.code_lists == 'undefined') return;
            switch (type) {
                case "service":
                    mickaDS.level2_types = mickaDS.code_lists.serviceType;
                    break;
                case "application":
                    mickaDS.level2_types = mickaDS.code_lists.applicationType;
                    break;
            }
        }

        me.changeSuggestionConfig = function (input, param, field) {
            me.suggestionConfig = {
                input: input,
                param: param,
                field: field
            };
        }

        /**
        * @function suggestionFilterChanged
        * @memberOf hs.datasourceBrowserService
        * @param {object} mickaDS Micka catalogue config passed here from directive
        * Send suggestion request to Micka CSW server and parse response
        */
        me.suggestionFilterChanged = function (mickaDS) {
            var url = mickaDS.url + '../util/suggest.php?' + utils.paramsToURL({
                type: me.suggestionConfig.param,
                query: me.suggestionFilter
            });
            url = utils.proxify(url);
            me.suggestionsLoaded = false;
            me.suggestions = [];
            $http({
                method: 'GET',
                url: url
            }).then(function successCallback(response) {
                var j = response.data;
                me.suggestionsLoaded = true;
                me.suggestions = j.records;
            })
        }
    }
]