export default ['config', 'hs.datasourceMickaFilterService', 'hs.datasource_selector.service', 
function (config, mickaFilterService, datasourceSelectorService) {
    return {
        template: require('components/datasource-selector/micka/dialog_micka_suggestions.html'),
        link: function (scope, element, attrs) {
            scope.suggestionsModalVisible = true;
            scope.loaderImage = require('img/ajax-loader.gif');
            mickaFilterService.suggestionFilter = datasourceSelectorService.data.query[mickaFilterService.suggestionConfig.input];
            document.getElementById('ds-sug-filter').focus();
        }
    };
}]