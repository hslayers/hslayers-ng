/**
 * @param HsConfig
 * @param HsMickaFiltersService
 * @param HsDatasourceBrowserService
 * @param $compile
 * @param HsLayoutService
 */
export default function (
  HsConfig,
  HsMickaFiltersService,
  HsDatasourceBrowserService,
  $compile,
  HsLayoutService
) {
  'ngInject';
  return {
    template: require('./advanced-micka-dialog.html'),
    link: function (scope, element, attrs) {
      scope.modalVisible = true;

      scope.mickaFilterService = HsMickaFiltersService;
      scope.datasourceSelectorService = HsDatasourceBrowserService;
      scope.qaery = HsDatasourceBrowserService.query;
      scope.mickaDatasetConfig = scope.$eval(attrs['mickaDatasetConfig']);

      /**
       * @function showSuggestions
       * @memberOf hs.datasource_selector
       * @param {string} input Suggestion class type name (e.g. "Organisation Name")
       * @param {string} param Suggestion paramater of Micka service (e.g. "org")
       * @param {string} field Expected property name in response object (e.g. "value")
       * Shows suggestions dialog and edits suggestion config.
       */
      scope.showSuggestions = function (input, param, field) {
        HsMickaFiltersService.changeSuggestionConfig(input, param, field);
        if (HsConfig.design === 'md') {
          HsMickaFiltersService.suggestionFilter =
            HsDatasourceBrowserService.data.query[input];
          HsMickaFiltersService.suggestionFilterChanged(
            scope.mickaDatasetConfig
          );
        } else {
          if (
            HsLayoutService.contentWrapper.querySelector(
              '.hs-ds-suggestions-micka'
            ) === null
          ) {
            const el = angular.element(
              '<div hs.micka-suggestions-dialog></span>'
            );
            HsLayoutService.contentWrapper
              .querySelector('.hs-dialog-area')
              .appendChild(el[0]);
            $compile(el)(scope);
          } else {
            scope.suggestionsModalVisible = true;
            const filterElement = HsLayoutService.contentWrapper.querySelector(
              '.hs-ds-sug-filter'
            );
            HsMickaFiltersService.suggestionFilter = scope.data.query[input];
            filterElement.focus();
          }
          HsMickaFiltersService.suggestionFilterChanged(
            scope.mickaDatasetConfig
          );
        }
      };

      /**
       * @function addSuggestion
       * @memberOf HsDatasourceBrowserService
       * @param {string} text Selected property value from suggestions
       * Save suggestion into Query object
       */
      scope.addSuggestion = function (text) {
        HsDatasourceBrowserService.data.query[
          HsMickaFiltersService.suggestionConfig.input
        ] = text;
        scope.suggestionsModalVisible = false;
      };
    },
  };
}
