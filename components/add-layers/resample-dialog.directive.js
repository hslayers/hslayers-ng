export default ['config', function (config) {
    return {
        template: require('components/add-layers/partials/dialog_proxyconfirm.html'),
        link: function (scope, element, attrs) {
            scope.resampleModalVisible = true;
        }
    };
}]