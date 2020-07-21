/**
 * @param $http
 * @param $q
 * @param HsUtilsService
 * @param HsCommonEndpointsService
 */
export const HsMickaFilterService = function ($http, $q, HsUtilsService, HsCommonEndpointsService) {
  'ngInject';
  const me = this;
  this.suggestionConfig = {};
  this.suggestions = [];
  this.suggestionsLoaded = true;
  this.filterByExtent = true;
  me.otnKeywords = [];

  if (
    HsCommonEndpointsService.endpoints &&
    HsCommonEndpointsService.endpoints.filter(
      (ds) => ds.url.indexOf('opentnet.eu') > -1
    ).length > 0
  ) {
    $http({
      method: 'GET',
      url: HsUtilsService.proxify(
        'http://opentransportnet.eu:8082/api/3/action/vocabulary_show?id=36c07014-c461-4f19-b4dc-a38106144e66'
      ),
    }).then((response) => {
      me.otnKeywords = [{title: '-'}];
      response.data.result.tags.forEach((tag) => {
        me.otnKeywords.push({title: tag.name});
      });
    });
  }

  /**
   * @function fillCodesets
   * @memberOf HsDatasourceBrowserService
   * @param {object} datasets Input datasources
   * Download codelists for all "micka" type datasources from Url specified in app config.
   */
  me.fillCodesets = function () {
    HsCommonEndpointsService.endpoints
      .filter((ep) => ep.type == 'micka')
      .forEach((ep) => me.fillCodeset(ep));
  };

  /**
   * @function fillCodeset
   * @memberOf HsDatasourceBrowserService
   * @param {object} ds Single datasource
   * Download code-list for micka type source from Url specifiead in app config.
   */
  me.fillCodeset = function (ds) {
    if (ds.type == 'micka') {
      let url = ds.code_list_url;
      if (url === undefined) {
        return;
      }
      url = HsUtilsService.proxify(url);
      if (ds.code_lists === undefined) {
        ds.code_lists = {
          serviceType: [],
          applicationType: [],
          dataType: [],
          topicCategory: [],
        };
      }
      if (ds.canceler !== undefined) {
        ds.canceler.resolve();
        delete ds.canceler;
      }
      ds.canceler = $q.defer();
      $http.get(url, {timeout: ds.canceler.promise}).then(
        (j) => {
          const oParser = new DOMParser();
          const oDOM = oParser.parseFromString(j.data, 'application/xml');
          const doc = oDOM.documentElement;
          doc.querySelectorAll('map serviceType value').forEach((type) => {
            ds.code_lists.serviceType.push({
              value: type.attributes.name.value,
              name: type.innerHTML,
            });
          });
          doc.querySelectorAll('map applicationType value').forEach((type) => {
            ds.code_lists.applicationType.push({
              value: type.attributes.name.value,
              name: type.innerHTML,
            });
          });
          doc.querySelectorAll('map topicCategory value').forEach((type) => {
            ds.code_lists.topicCategory.push({
              value: type.attributes.name.value,
              name: type.innerHTML,
            });
          });
          me.advancedMickaTypeChanged(ds, 'service');
        },
        (err) => {}
      );
    }
  };

  /**
   * @function advancedMickaTypeChanged
   * @memberOf HsDatasourceBrowserService
   * @param {object} mickaDS Micka dataset definition
   * @param {string} type Micka query type
   * Sets Micka source level types according to current query type (service/appilication). Deprecated?
   */
  me.advancedMickaTypeChanged = function (mickaDS, type) {
    if (mickaDS.code_lists === undefined) {
      return;
    }
    switch (type) {
      default:
      case 'service':
        mickaDS.level2_types = mickaDS.code_lists.serviceType;
        break;
      case 'application':
        mickaDS.level2_types = mickaDS.code_lists.applicationType;
        break;
    }
  };

  me.changeSuggestionConfig = function (input, param, field) {
    me.suggestionConfig = {
      input: input,
      param: param,
      field: field,
    };
  };

  /**
   * @function suggestionFilterChanged
   * @memberOf HsDatasourceBrowserService
   * @param {object} mickaDS Micka catalogue config passed here from directive
   * Send suggestion request to Micka CSW server and parse response
   */
  me.suggestionFilterChanged = function (mickaDS) {
    let url =
      mickaDS.url +
      '../util/suggest.php?' +
      HsUtilsService.paramsToURL({
        type: me.suggestionConfig.param,
        query: me.suggestionFilter,
      });
    url = HsUtilsService.proxify(url);
    me.suggestionsLoaded = false;
    me.suggestions = [];
    $http({
      method: 'GET',
      url: url,
    }).then((response) => {
      const j = response.data;
      me.suggestionsLoaded = true;
      me.suggestions = j.records;
    });
  };
  return me;
}
