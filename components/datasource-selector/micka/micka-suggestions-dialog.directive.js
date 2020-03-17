export default ['config', 'hs.mickaFiltersService', 'hs.datasourceBrowserService', 'hs.layout.service',
  function (config, mickaFilterService, datasourceBrowserService, layoutService) {
    return {
      template: require('./micka-suggestions-dialog.html'),
      link: function (scope, element, attrs) {
        scope.suggestionsModalVisible = true;
        scope.loaderImage = require('../../../img/ajax-loader.gif');
        mickaFilterService.suggestionFilter = datasourceBrowserService.data.query[mickaFilterService.suggestionConfig.input];
        layoutService.contentWrapper.querySelector('.hs-ds-sug-filter').focus();
      }
    };
  }];
