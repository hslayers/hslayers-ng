export default ['config', function (config) {
    return {
        template: require('components/add-layers/partials/dialog_getcapabilities_error.html'),
        link: function (scope, element, attrs) {
            scope.capabilitiesErrorModalVisible = true;
        }
    };
}]