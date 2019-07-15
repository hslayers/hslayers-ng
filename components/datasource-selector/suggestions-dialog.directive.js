export default ['config', function (config) {
    return {
        template: require('components/datasource-selector/partials/dialog_micka_suggestions.html'),
        link: function (scope, element, attrs) {
            scope.suggestionsModalVisible = true;
            scope.data.suggestionFilter = scope.data.query[scope.data.suggestionConfig.input];
            document.getElementById('ds-sug-filter').focus();
            scope.DS.suggestionFilterChanged();
        }
    };
}]