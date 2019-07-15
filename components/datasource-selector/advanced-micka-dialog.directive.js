export default ['config', function (config) {
    return {
        template: require('components/datasource-selector/partials/dialog_micka_advanced.html'),
        link: function (scope, element, attrs) {
            scope.modalVisible = true;
        }
    };
}]