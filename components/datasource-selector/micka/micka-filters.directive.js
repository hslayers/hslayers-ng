/**
 * @param HsMickaFiltersService
 * @param HsDatasourceBrowserService
 * @param $compile
 * @param HsLayoutService
 */
export default function (
  HsMickaFiltersService,
  HsDatasourceBrowserService,
  $compile,
  HsLayoutService
) {
  'ngInject';
  return {
    template: require('./micka-filters.html'),
    link: function (scope, element, attrs) {
      scope.mickaFilterService = HsMickaFiltersService;
      scope.query = HsDatasourceBrowserService.data.query;
      scope.mickaDatasetConfig = scope.$eval(attrs['mickaDatasetConfig']);
      scope.queryCatalogs = HsDatasourceBrowserService.queryCatalogs;

      /**
       * @function openMickaAdvancedSearch
       * @memberOf hs.mickaFiltersDirective
       * @param {object} mickaDatasetConfig Micka datasource config
       * Opens Micka Advanced Search dialog, might pass current search string.
       */
      scope.openMickaAdvancedSearch = function (mickaDatasetConfig) {
        if (
          HsLayoutService.contentWrapper.querySelector(
            '.hs-ds-advanced-micka'
          ) === null
        ) {
          const el = angular.element('<div hs.adv-micka-dialog></div>');
          el[0].setAttribute(
            'micka-dataset-config',
            angular.toJson(mickaDatasetConfig)
          );
          $compile(el)(scope);
          HsLayoutService.contentWrapper
            .querySelector('.hs-dialog-area')
            .appendChild(el[0]);
        } else {
          scope.modalVisible = true;
        }
        if (HsDatasourceBrowserService.data.query.title) {
          HsDatasourceBrowserService.data.query.textFilter =
            HsDatasourceBrowserService.data.query.title;
        }
      };

      /**
       * @function setOtnKeyword
       * @memberOf hs.mickaFiltersDirective
       * @param {string} theme Selected Otn theme keyword
       * Select Otn Keyword as query subject (used with dropdown list in Gui)
       */
      scope.setOtnKeyword = function (theme) {
        if (theme == '-') {
          theme = '';
        }
        HsDatasourceBrowserService.data.query.Subject = theme;
        HsDatasourceBrowserService.queryCatalogs();
      };
    },
  };
}
