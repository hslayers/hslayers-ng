export default ['config', 'hs.mickaFiltersService', 'hs.datasourceBrowserService', 
function (config, mickaFilterService, datasourceBrowserService) {
    return {
        template: require('./micka-suggestions-dialog.html'),
        link: function (scope, element, attrs) {
            scope.suggestionsModalVisible = true;
            scope.loaderImage = require('img/ajax-loader.gif');
            mickaFilterService.suggestionFilter = datasourceBrowserService.data.query[mickaFilterService.suggestionConfig.input];
            document.getElementById('ds-sug-filter').focus();
        }
    };
}]