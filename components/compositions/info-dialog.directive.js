export default ['config', function (config) {
    return {
        template: require('components/compositions/partials/dialog_info.html'),
        link: function (scope, element, attrs) {
            scope.infoModalVisible = true;
        }
    };
}]