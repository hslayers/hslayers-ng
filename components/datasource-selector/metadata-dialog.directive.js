export default ['config', function (config) {
    return {
        template: require('components/datasource-selector/partials/dialog_metadata.html'),
        link: function (scope, element, attrs) {
            scope.metadataModalVisible = true;
        }
    };
}]