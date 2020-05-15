/**
 * @param HsMickaFiltersService
 * @param HsDatasourceBrowserService
 * @param HsLayoutService
 */
export default function (
  HsMickaFiltersService,
  HsDatasourceBrowserService,
  HsLayoutService
) {
  'ngInject';
  return {
    template: require('./micka-suggestions-dialog.html'),
    link: function (scope, element, attrs) {
      scope.suggestionsModalVisible = true;
      scope.loaderImage = require('../../../img/ajax-loader.gif');
      HsMickaFiltersService.suggestionFilter =
        HsDatasourceBrowserService.data.query[
          HsMickaFiltersService.suggestionConfig.input
        ];
      HsLayoutService.contentWrapper.querySelector('.hs-ds-sug-filter').focus();
    },
  };
}
