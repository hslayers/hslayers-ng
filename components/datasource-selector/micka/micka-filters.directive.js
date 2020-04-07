export default [
  'config',
  'hs.mickaFiltersService',
  'hs.datasourceBrowserService',
  '$compile',
  'hs.layout.service',
  function (
    config,
    mickaFilterService,
    datasourceBrowserService,
    $compile,
    layoutService
  ) {
    return {
      template: require('./micka-filters.html'),
      link: function (scope, element, attrs) {
        scope.mickaFilterService = mickaFilterService;
        scope.query = datasourceBrowserService.data.query;
        scope.mickaDatasetConfig = scope.$eval(attrs['mickaDatasetConfig']);
        scope.queryCatalogs = datasourceBrowserService.queryCatalogs;

        /**
         * @function openMickaAdvancedSearch
         * @memberOf hs.mickaFiltersDirective
         * @param {Object} mickaDatasetConfig Micka datasource config
         * Opens Micka Advanced Search dialog, might pass current search string.
         */
        scope.openMickaAdvancedSearch = function (mickaDatasetConfig) {
          if (
            layoutService.contentWrapper.querySelector(
              '.hs-ds-advanced-micka'
            ) === null
          ) {
            const el = angular.element('<div hs.adv-micka-dialog></div>');
            el[0].setAttribute(
              'micka-dataset-config',
              angular.toJson(mickaDatasetConfig)
            );
            $compile(el)(scope);
            layoutService.contentWrapper
              .querySelector('.hs-dialog-area')
              .appendChild(el[0]);
          } else {
            scope.modalVisible = true;
          }
          if (datasourceBrowserService.data.query.title) {
            datasourceBrowserService.data.query.textFilter =
              datasourceBrowserService.data.query.title;
          }
        };

        /**
         * @function setOtnKeyword
         * @memberOf hs.mickaFiltersDirective
         * @param {String} theme Selected Otn theme keyword
         * Select Otn Keyword as query subject (used with dropdown list in Gui)
         */
        scope.setOtnKeyword = function (theme) {
          if (theme == '-') {
            theme = '';
          }
          datasourceBrowserService.data.query.Subject = theme;
          datasourceBrowserService.queryCatalogs();
        };
      },
    };
  },
];
